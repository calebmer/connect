import * as _APIServerDefinition from "./methods";
import {
  APIError,
  APIErrorCode,
  APIResult,
  APISchema,
  APISubscriptionMessageClient,
  APISubscriptionMessageServer,
  AccountID,
  JSONObjectValue,
  JSONValue,
  SchemaBase,
  SchemaInput,
  SchemaInputArray,
  SchemaInputObject,
  SchemaKind,
  SchemaMethod,
  SchemaMethodUnauthorized,
  SchemaNamespace,
  SchemaSubscription,
  SubscriptionID,
  isSyntaxJSON,
} from "@connect/api-client";
import {AccessTokenData, AccessTokenGenerator} from "./AccessToken";
import {Context, ContextSubscription, ContextUnauthorized} from "./Context";
import {DEV, TEST} from "./RunConfig";
import {NextFunction, Request, Response} from "express";
import {ParsedUrlQuery} from "querystring";
import WebSocket from "ws";
import express from "express";
import http from "http";
import jwt from "jsonwebtoken";
import {logError} from "./logError";
import morgan from "morgan";

/** The Express HTTP application for our API. */
const APIServerHTTP = express();

// Setup our HTTP server...
APIServerHTTP.set("x-powered-by", false);
APIServerHTTP.set("etag", false);
if (DEV) APIServerHTTP.set("json spaces", 2);
if (DEV) APIServerHTTP.use(morgan("dev"));

// Parse JSON HTTP bodies.
APIServerHTTP.use(express.json());

/** The Node.js API server. */
const APIServer = http.createServer(APIServerHTTP);

/** The WebSocket server for our API. */
const APIServerWS = new WebSocket.Server({server: APIServer});

/** The routes for our web socket server. */
const wsRouter = new Map<
  string,
  {
    definition: ServerSubscription<JSONObjectValue, JSONObjectValue>;
    schema: SchemaSubscription<JSONObjectValue, JSONObjectValue>;
  }
>();

/**
 * The definition of all our API server methods. The method implementations live
 * in the `./methods` folder. Here we combine all the methods together and
 * verify that they have the correct type.
 *
 * NOTE: If this variable fails to type check then that means one of our API
 * method implementations has an incorrect type!
 */
const APIServerDefinition: Server<typeof APISchema> = _APIServerDefinition;

// Initialize our `APIServer` using our `APISchema`. This will add all the
// routes we need to our Express server.
initializeServer([], APIServerDefinition, APISchema);

/**
 * Initializes the server with any kind of API schema.
 */
function initializeServer(
  path: Array<string>,
  definition: Server<SchemaBase>,
  schema: SchemaBase,
): void {
  switch (schema.kind) {
    case SchemaKind.NAMESPACE:
      return initializeServerNamespace(path, definition as any, schema);
    case SchemaKind.METHOD:
      return initializeServerMethod(path, definition as any, schema);
    case SchemaKind.METHOD_UNAUTHORIZED:
      return initializeServerMethodUnauthorized(
        path,
        definition as any,
        schema,
      );
    case SchemaKind.SUBSCRIPTION:
      return initializeServerSubscription(path, definition as any, schema);
    default: {
      const never: never = schema;
      return never;
    }
  }
}

/**
 * Initializes the server with a schema namespace by adding the namespace name
 * to the path stack.
 */
function initializeServerNamespace<
  Schemas extends {readonly [key: string]: SchemaBase}
>(
  path: Array<string>,
  definition: ServerNamespace<Schemas>,
  namespaceSchema: SchemaNamespace<Schemas>,
): void {
  // Loop through all the entries in our namespace and add their schema to
  // our client.
  for (const [key, schema] of Object.entries(namespaceSchema.schemas)) {
    path.push(key);
    initializeServer(path, definition[key], schema);
    path.pop();
  }
}

/**
 * Parses the `Bearer` auth scheme token out of the `Authorization` header as
 * defined by [RFC7235][1].
 *
 * ```
 * Authorization = credentials
 * credentials   = auth-scheme [ 1*SP ( token68 / #auth-param ) ]
 * token68       = 1*( ALPHA / DIGIT / "-" / "." / "_" / "~" / "+" / "/" )*"="
 * ```
 *
 * [1]: https://tools.ietf.org/html/rfc7235
 *
 * @private
 */
const authorizationHeaderRegex = /^\s*bearer\s+([a-z0-9\-._~+/]+=*)\s*$/i;

/**
 * Initializes the server with a method that does not need authorization.
 */
function initializeServerMethod<
  Input extends JSONObjectValue,
  Output extends JSONObjectValue
>(
  path: ReadonlyArray<string>,
  definition: ServerMethod<Input, Output>,
  schema: SchemaMethod<Input, Output>,
): void {
  // The path to this API method.
  const apiPath = `/${path.join("/")}`;

  // Register this method on our API server. When this method is executed we
  // will call the appropriate function.
  APIServerHTTP.use(
    apiPath,
    handleResponse<Output>({safe: schema.safe}, async req => {
      const accessToken = await getRequestAuthorization(req);
      const input = getRequestInput(req, schema.input);
      return Context.withAuthorized(accessToken.id, ctx => {
        return definition(ctx, input);
      });
    }),
  );
}

/**
 * Initializes the server with a method that does not need authorization.
 */
function initializeServerMethodUnauthorized<
  Input extends JSONObjectValue,
  Output extends JSONObjectValue
>(
  path: ReadonlyArray<string>,
  definition: ServerMethodUnauthorized<Input, Output>,
  schema: SchemaMethodUnauthorized<Input, Output>,
): void {
  // The path to this API method.
  const apiPath = `/${path.join("/")}`;

  // Register this method on our API server. When this method is executed we
  // will call the appropriate function.
  APIServerHTTP.use(
    apiPath,
    handleResponse<Output>({safe: schema.safe}, req => {
      const input = getRequestInput(req, schema.input);
      return Context.withUnauthorized(ctx => {
        return definition(ctx, input);
      });
    }),
  );
}

/**
 * Small utility for helping to build an API request. Handles turning an API
 * response into an HTTP response.
 */
function handleResponse<Output>(
  {safe}: {safe: boolean},
  handler: (req: Request) => Promise<Output>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Throw an error if the client is using the wrong HTTP method for this
    // API request. Safe methods should use `GET` and unsafe methods should
    // use `POST`.
    if (safe) {
      if (req.method !== "GET") {
        res.statusCode = 405;
        throw new APIError(APIErrorCode.BAD_INPUT);
      }
    } else {
      if (req.method !== "POST") {
        res.statusCode = 405;
        throw new APIError(APIErrorCode.BAD_INPUT);
      }
    }

    // TODO: re-enable
    //
    // // In development, throw an error from our API some percent of the time to
    // // force developers to think about the error state of their applications.
    // //
    // // For safe requests (`GET`) throw an error 2% of the time. For unsafe
    // // requests (`POST`) throw an error 10% of the time.
    // if (DEV) {
    //   if (safe) {
    //     if (Math.random() <= 0.02) {
    //       throw new APIError(APIErrorCode.CHAOS_MONKEY);
    //     }
    //   } else {
    //     if (Math.random() <= 0.1) {
    //       throw new APIError(APIErrorCode.CHAOS_MONKEY);
    //     }
    //   }
    // }

    handler(req).then(output => {
      // Construct the successful result of an API request.
      const result: APIResult<Output> = {
        ok: true,
        data: output,
      };

      // Send the successful result to our client.
      res.status(200).json(result);
    }, next);
  };
}

/**
 * Gets the input depending on the request method. If the request method is
 * not `GET` or `POST` then we throw an error.
 */
function getRequestInput<Input extends JSONObjectValue>(
  req: Request,
  schemaInput: SchemaInputObject<Input>,
): Input {
  switch (req.method) {
    case "GET":
      return getRequestQueryInput(req, schemaInput);
    case "POST":
      return getRequestBodyInput(req, schemaInput);
    default:
      throw new Error(`Unrecognized method ${req.method}.`);
  }
}

/**
 * Gets the input from the `GET`.
 */
function getRequestQueryInput<Input extends JSONObjectValue>(
  req: Request,
  schemaInput: SchemaInputObject<Input>,
): Input {
  // Get parsed URL query from our request object.
  const input: ParsedUrlQuery = req.query;

  // Right now, all of the values in our query object are strings. Iterate
  // through all the values and parse them as JSON.
  try {
    for (const [key, value] of Object.entries(input)) {
      if (Array.isArray(value)) {
        for (let i = 0; i < value.length; i++) {
          value[i] = queryStringValueDeserialize(value[i]);
        }
      } else {
        const actualValue = queryStringValueDeserialize(value);

        // If this query parameter was supposed to be an array but only one
        // query parameter was provided then lets convert it into an array with
        // a single element.
        if (schemaInput.inputs[key] instanceof SchemaInputArray) {
          input[key] = [actualValue];
        } else {
          input[key] = actualValue;
        }
      }
    }
  } catch (error) {
    throw new APIError(APIErrorCode.BAD_INPUT);
  }

  // If we expected an array but there were no query parameters for that key
  // in our query then that means we have an empty array. Set an empty array
  // to our input and continue.
  for (const [key, schemaInputProp] of Object.entries(schemaInput.inputs)) {
    if (schemaInputProp instanceof SchemaInputArray && input[key] == null) {
      input[key] = [];
    }
  }

  // Validate that the input from our request body is correct. If the input
  // is not correct then throw an API error.
  if (!schemaInput.validate(input)) {
    throw new APIError(APIErrorCode.BAD_INPUT);
  }

  return input;
}

/**
 * JSON parses all values except for strings that start with a letter and aren’t
 * JSON keywords.
 */
function queryStringValueDeserialize(value: string): any {
  if (isSyntaxJSON(value)) {
    return JSON.parse(value);
  } else {
    return value;
  }
}

/**
 * Gets the input for a request from the `POST` request’s body. Throws an error
 * if the input is not valid.
 */
function getRequestBodyInput<Input extends JSONObjectValue>(
  req: Request,
  schemaInput: SchemaInput<Input>,
): Input {
  // Get the input from our request body.
  const input: JSONValue = req.body;

  // Validate that the input from our request body is correct. If the input
  // is not correct then throw an API error.
  if (!schemaInput.validate(input)) {
    throw new APIError(APIErrorCode.BAD_INPUT);
  }

  // Return the validated input.
  return input;
}

/**
 * Gets the access token for a request. Throws an error if the access token does
 * not exist or is not valid.
 */
async function getRequestAuthorization(req: Request): Promise<AccessTokenData> {
  // Get the authorization header. If there is no authorization header then
  // the client is unauthorized and can’t continue.
  const authorizationHeader = req.headers.authorization;
  if (!authorizationHeader) throw new APIError(APIErrorCode.UNAUTHORIZED);

  // Parse the access token from the authorization header. If the
  // authorization header is not in the correct “bearer” auth scheme then
  // the client is unauthorized and can’t continue.
  const match = authorizationHeaderRegex.exec(authorizationHeader);
  if (!match) throw new APIError(APIErrorCode.UNAUTHORIZED);

  // Next verify the JWT token using our shared JWT secret.
  let accessToken: AccessTokenData;
  try {
    accessToken = await AccessTokenGenerator.verify(match[1]);
  } catch (error) {
    // If we failed to verify the token then return an unauthorized API
    // error. If the token was expired then return a token expired
    // error code.
    let code = APIErrorCode.UNAUTHORIZED;
    if (error instanceof jwt.TokenExpiredError)
      code = APIErrorCode.ACCESS_TOKEN_EXPIRED;
    throw new APIError(code);
  }

  return accessToken;
}

// Add a fallback handler for any unrecognized method.
APIServerHTTP.use((_req: Request, res: Response) => {
  res.statusCode = 404;
  throw new APIError(APIErrorCode.UNRECOGNIZED_METHOD);
});

// Add an error handler.
APIServerHTTP.use(
  (error: unknown, _req: Request, res: Response, next: NextFunction) => {
    // If the headers have already been sent, let Express handle the error.
    if (res.headersSent) {
      next(error);
      return;
    }

    // If `body-parser` failed to parse this error then it will set the `type`
    // field to a constant we can check for.
    if (
      error instanceof Error &&
      (error as any).type === "entity.parse.failed"
    ) {
      error = new APIError(APIErrorCode.BAD_INPUT);
    }

    // In development, print the error stack trace to stderr for debugging.
    if (!TEST && !(error instanceof APIError)) {
      logError(error);
    }

    // If the response status code is not an error status code then we need to
    // set one. If the error is an instance of `APIError` then the error is the
    // client’s fault (400) otherwise it’s our fault (500).
    if (!(res.statusCode >= 400 && res.statusCode < 600)) {
      if (error instanceof APIError) {
        switch (error.code) {
          case APIErrorCode.UNAUTHORIZED:
          case APIErrorCode.ACCESS_TOKEN_EXPIRED:
            res.statusCode = 401;
            break;
          case APIErrorCode.NOT_FOUND:
            res.statusCode = 404;
            break;
          case APIErrorCode.CHAOS_MONKEY:
            res.statusCode = 500;
            break;
          default:
            res.statusCode = 400;
            break;
        }
      } else {
        res.statusCode = (error as any).statusCode
          ? (error as any).statusCode
          : 500;
      }
    }

    // Setup the API result we will send to our client.
    const result: APIResult<never> = {
      ok: false,
      error: APIError.toJSON(error),
    };

    // Send our error response!
    res.json(result);
  },
);

/**
 * Initializes the websocket server with a subscription.
 */
function initializeServerSubscription<
  Input extends JSONObjectValue,
  Message extends JSONObjectValue
>(
  path: ReadonlyArray<string>,
  definition: ServerSubscription<Input, Message>,
  schema: SchemaSubscription<Input, Message>,
): void {
  // Create a map with all the subscription paths so that when a connected
  // client subscribes to one of them we will know what behavior to use.
  wsRouter.set(`/${path.join("/")}`, {
    definition,
    schema,
  } as any);
}

/**
 * Whenever we get a web socket connection, initialize all the appropriate
 * listeners so that we can handle a session appropriately.
 */
APIServerWS.on("connection", socket => {
  /**
   * All of the subscriptions that are currently active for our socket. We will
   * clean these up when the socket closes.
   */
  const subscriptions = new Map<SubscriptionID, Promise<() => Promise<void>>>();

  // Whenever we receive a pong for our socket, we know that the socket is
  // still alive.
  (socket as any).isAlive = true;
  socket.on("pong", () => {
    (socket as any).isAlive = true;
  });

  // Report any socket errors to stderr.
  socket.on("error", error => logError(error));

  // When the socket closes we want to unsubscribe from all of our
  // subscriptions! Otherwise we have a memory leak.
  socket.on("close", () => {
    // Unsubscribe from all of our subscriptions in parallel.
    for (const unsubscribe of subscriptions.values()) {
      unsubscribe
        .then(unsubscribe => unsubscribe())
        .catch(error => logError(error));
    }
    // Immediately clear the subscriptions map since we’ve closed the socket
    // and there should be no more subscriptions.
    subscriptions.clear();
  });

  // Subscribe to all the messages from our client. Remember that any errors
  // thrown by our message handler will be caught and dealt with.
  socket.on("message", async rawMessage => {
    try {
      // We only support string web socket messages. We do not currently
      // support binary messages.
      if (typeof rawMessage !== "string") {
        throw new APIError(APIErrorCode.BAD_INPUT);
      }

      // The message must be a JSON string. If the message is not a JSON
      // string then throw a bad input error.
      let message: JSONValue;
      try {
        message = JSON.parse(rawMessage);
      } catch (error) {
        throw new APIError(APIErrorCode.BAD_INPUT);
      }

      // Validate that the message, which is user input, is indeed a
      // subscription message! We can’t trust the message to be valid since
      // the user could give us any arbitrary JSON value.
      if (!APISubscriptionMessageClient.validate(message)) {
        throw new APIError(APIErrorCode.BAD_INPUT);
      }

      // Finally, handle the message. It returns a promise so we want to await
      // that in case it throws an error.
      await handleMessage(message);
    } catch (error) {
      // If this was not an unexpected error then log it to the console.
      if (!(error instanceof APIError)) {
        logError(error);
      }
      // Always report our errors back to the user.
      publish({
        type: "error",
        error: APIError.toJSON(error),
      });
    }
  });

  /**
   * Handles an incoming message from our client.
   */
  async function handleMessage(message: APISubscriptionMessageClient) {
    switch (message.type) {
      case "subscribe": {
        const subscriptionRoute = wsRouter.get(message.path);
        if (subscriptionRoute === undefined) {
          throw new APIError(APIErrorCode.NOT_FOUND);
        }
        return await handleSubscribe(
          subscriptionRoute.definition,
          subscriptionRoute.schema,
          message.id,
          message.input,
        );
      }
      case "unsubscribe": {
        return await handleUnsubscribe(message.id);
      }
      default:
        throw new Error(`Unexpected message "${message["type"]}"`);
    }
  }

  /**
   * Handles an incoming subscription message from our client.
   */
  async function handleSubscribe<
    Input extends JSONObjectValue,
    Message extends JSONObjectValue
  >(
    definition: ServerSubscription<Input, Message>,
    schema: SchemaSubscription<Input, Message>,
    id: SubscriptionID,
    input: JSONValue,
  ) {
    // We require the ID for this subscription to be unique for the client’s
    // session. So throw an error if it is not unique.
    if (subscriptions.has(id)) {
      throw new APIError(APIErrorCode.ALREADY_EXISTS);
    }

    // Check to make sure that the user-provided input is valid input for our
    // subscription schema.
    if (!schema.input.validate(input)) {
      throw new APIError(APIErrorCode.BAD_INPUT);
    }

    // Create the context for our subscription. When we publish to our
    // subscription we will, in turn, publish to our client using the ID they
    // gave us so the client knows the exact subscription the new message
    // is for.
    //
    // TODO: Somehow provide an actual account ID!
    const ctx = new ContextSubscription<Message>(42 as AccountID, message => {
      publish({type: "message", id, message});
    });

    // Setup our subscription! Store the unsubscribe function for later usage.
    //
    // IMPORTANT: We need to set our subscription in the map synchronously so
    // that if another subscription with the same ID comes in we can error. The
    // promise we store in the map won’t throw an error.
    const unsubscribe = definition(ctx, input);
    subscriptions.set(id, unsubscribe.catch(() => async () => {}));
    await unsubscribe;
  }

  /**
   * Handles the client unsubscribing from a previous subscription it set up.
   */
  async function handleUnsubscribe(id: SubscriptionID) {
    const unsubscribe = subscriptions.get(id);

    // Cannot unsubscribe from a subscription that was never started.
    if (unsubscribe === undefined) {
      throw new APIError(APIErrorCode.NOT_FOUND);
    }

    // Delete the subscription from the map so we don’t unsubscribe again when
    // the socket closes.
    subscriptions.delete(id);

    // Call the unsubscribe function.
    await unsubscribe.then(unsubscribe => unsubscribe());
  }

  /**
   * Publishes a message to our API client.
   */
  function publish(message: APISubscriptionMessageServer) {
    socket.send(JSON.stringify(message));
  }
});

/**
 * Detects and terminates broken connections. We do this by sending a ping. If
 * we haven’t received a pong back by the time this runs again then we assume
 * the socket is broken and terminate it.
 */
function detectBrokenConnections() {
  APIServerWS.clients.forEach(socket => {
    // If the socket is not alive then terminate it. We should get a pong
    // request back which will mark our socket as alive.
    if ((socket as any).isAlive === false) {
      socket.terminate();
      return;
    }

    // Ping our socket. Once we get a pong back we can mark this client
    // as alive.
    (socket as any).isAlive = false;
    socket.ping();
  });
}

// Export the finished API server.
export {APIServer, APIServerWS, detectBrokenConnections};

/**
 * Creates the type for an API server definition based on the API schema.
 */
type Server<
  Schema extends SchemaBase
> = Schema extends SchemaNamespace<infer Schemas> // prettier-ignore
  ? ServerNamespace<Schemas>
  : Schema extends SchemaMethod<infer Input, infer Output>
  ? ServerMethod<Input, Output>
  : Schema extends SchemaMethodUnauthorized<infer Input, infer Output>
  ? ServerMethodUnauthorized<Input, Output>
  : Schema extends SchemaSubscription<infer Input, infer Message>
  ? ServerSubscription<Input, Message>
  : never;

/**
 * Creates the type of a namespace for the API server.
 */
type ServerNamespace<Schemas extends {readonly [key: string]: SchemaBase}> = {
  readonly [Key in keyof Schemas]: Server<Schemas[Key]>
};

/**
 * The type of a server-side definition for an authorized method. It takes the
 * method input and some authorized context.
 */
type ServerMethod<Input, Output> = (
  ctx: Context,
  input: Input,
) => Promise<Output>;

/**
 * The type of a server-side definition for an unauthorized method. It takes the
 * method input and some unauthorized context.
 */
type ServerMethodUnauthorized<Input, Output> = (
  ctx: ContextUnauthorized,
  input: Input,
) => Promise<Output>;

/**
 * The type of a server-side definition for a subscription. It takes some input
 * and asynchronously establishes a subscription. To publish messages call
 * `ContextSubscription.publish`. Once it’s time to unsubscribe we call the
 * function returned by the subscription which will clean up the subscription.
 */
type ServerSubscription<Input, Message> = (
  ctx: ContextSubscription<Message>,
  input: Input,
) => Promise<() => Promise<void>>;
