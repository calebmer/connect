import * as _APIServerDefinition from "./methods";
import {
  APIError,
  APIErrorCode,
  APIResult,
  APISchema,
  AccountID,
  JSONObjectValue,
  SchemaBase,
  SchemaInput,
  SchemaKind,
  SchemaMethod,
  SchemaMethodUnauthorized,
  SchemaNamespace,
} from "@connect/api-client";
import {AccessTokenData, AccessTokenGenerator} from "./entities/Tokens";
import {NextFunction, Request, Response} from "express";
import {PGClient} from "./PGClient";
import {PGContext} from "./PGContext";
import chalk from "chalk";
import express from "express";
import jwt from "jsonwebtoken";
import morgan from "morgan";
import querystring from "querystring";

/**
 * The HTTP server for our API. Powered by Express.
 */
const APIServer = express();
APIServer.set("x-powered-by", false);
APIServer.set("etag", false);

// Log all our requests for debugging.
if (process.env.NODE_ENV === "development") {
  APIServer.use(morgan("dev"));
}

// Parse JSON HTTP bodies.
APIServer.use(express.json());

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
  if (schema.safe === true) {
    APIServer.get(
      apiPath,
      handleResponse<Output>(async req => {
        const accessToken = await getRequestAuthorization(req);
        const input = getRequestQueryInput(req, schema.input);
        return PGClient.with(client => {
          return definition(PGContext.get(client), accessToken.id, input);
        });
      }),
    );
  } else {
    APIServer.post(
      apiPath,
      handleResponse<Output>(async req => {
        const accessToken = await getRequestAuthorization(req);
        const input = getRequestBodyInput(req, schema.input);
        return PGClient.with(client => {
          return definition(PGContext.get(client), accessToken.id, input);
        });
      }),
    );
  }
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
  if (schema.safe === true) {
    APIServer.get(
      apiPath,
      handleResponse<Output>(req => {
        const input = getRequestQueryInput(req, schema.input);
        return PGClient.with(client => {
          return definition(PGContext.get(client), input);
        });
      }),
    );
  } else {
    APIServer.post(
      apiPath,
      handleResponse<Output>(req => {
        const input = getRequestBodyInput(req, schema.input);
        return PGClient.with(client => {
          return definition(PGContext.get(client), input);
        });
      }),
    );
  }
}

/**
 * Small utility for helping to build an API request. Handles turning an API
 * response into an HTTP response.
 */
function handleResponse<Output>(handler: (req: Request) => Promise<Output>) {
  return (req: Request, res: Response, next: NextFunction) => {
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
 * Gets the input from the GET
 */
function getRequestQueryInput<Input extends JSONObjectValue>(
  req: Request,
  schemaInput: SchemaInput<Input>,
): Input {
  // Get the input from our request body.
  const input = querystring.parse(req.query);

  // Right now, all of the values in our query object are strings. Iterate
  // through all the values and parse them as JSON.
  for (const [key, value] of Object.entries(input)) {
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        value[i] = JSON.parse(value[i]);
      }
    } else {
      input[key] = JSON.parse(value);
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
 * Gets the input for a request from the POST request’s body. Throws an error if
 * the input is not valid.
 */
function getRequestBodyInput<Input extends JSONObjectValue>(
  req: Request,
  schemaInput: SchemaInput<Input>,
): Input {
  // Get the input from our request body.
  const input: unknown = req.body;

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
APIServer.use((_req: Request, res: Response) => {
  res.statusCode = 404;
  throw new APIError(APIErrorCode.UNRECOGNIZED_METHOD);
});

// Add an error handler.
APIServer.use(
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
    if (process.env.NODE_ENV !== "test") {
      if (error instanceof Error && !(error instanceof APIError)) {
        console.error(chalk.red(error.stack || "")); // eslint-disable-line no-console
      }
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

    // Setup the result. If our error was an `APIError` then we get to add a
    // proper error code!
    let result: APIResult<never>;
    if (error instanceof APIError) {
      result = {
        ok: false,
        error: {code: error.code},
      };
    } else {
      result = {
        ok: false,
        error: {code: APIErrorCode.UNKNOWN},
      };
    }

    // Send our error response!
    res.json(result);
  },
);

// Export the finished API server.
export {APIServer};

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
  ctx: PGContext,
  accountID: AccountID,
  input: Input,
) => Promise<Output>;

/**
 * The type of a server-side definition for an unauthorized method. It takes the
 * method input and some unauthorized context.
 */
type ServerMethodUnauthorized<Input, Output> = (
  ctx: PGContext,
  input: Input,
) => Promise<Output>;
