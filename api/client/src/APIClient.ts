import {APIError, APIResult} from "./APIError";
import {JSONObjectValue, JSONValue} from "./JSONValue";
import {
  SchemaBase,
  SchemaKind,
  SchemaMethod,
  SchemaMethodUnauthorized,
  SchemaNamespace,
  SchemaSubscription,
} from "./Schema";
import {
  SubscriptionClientMessage,
  SubscriptionID,
  SubscriptionServerMessage,
} from "./Subscription";
import xs, {Listener, Stream} from "xstream";
import {APISchema} from "./APISchema";
import {AccessToken} from "./types/TokenTypes";
import {generateID} from "./generateID";

/**
 * The type of an API client.
 */
export type APIClient = Client<typeof APISchema>;

export const APIClient = {
  /**
   * Creates an API client. Allows us to execute requests against our
   * API server.
   *
   * Thanks to TypeScript being awesome we gets documentation, jump to
   * definition, and find references from `APISchema` all for free!
   */
  create(config: APIClientConfig): APIClient {
    return buildClient(config, [], APISchema) as any;
  },
};

/**
 * Configuration for our API client.
 */
export type APIClientConfig = {
  /**
   * The root url for our API client.
   */
  readonly url: string;
  /**
   * Fetches an access token to be used for authenticating with our API. May
   * return the access token either synchronously or asynchronously.
   */
  readonly auth?: () => AccessToken | null | Promise<AccessToken | null>;
};

/**
 * Creates the type for an API client based on its schema.
 */
type Client<
  Schema extends SchemaBase
> = Schema extends SchemaNamespace<infer Schemas> // prettier-ignore
  ? ClientNamespace<Schemas>
  : Schema extends SchemaMethod<infer Input, infer Output>
  ? ClientMethod<Input, Output>
  : Schema extends SchemaMethodUnauthorized<infer Input, infer Output>
  ? ClientMethod<Input, Output>
  : Schema extends SchemaSubscription<infer Input, infer Message>
  ? ClientSubscription<Input, Message>
  : never;

/**
 * The type of a namespace for the API client.
 */
type ClientNamespace<Schemas extends {readonly [key: string]: SchemaBase}> = {
  readonly [Key in keyof Schemas]: Client<Schemas[Key]>
};

/**
 * Options for a client method request.
 */
type ClientMethodOptions = {
  signal?: AbortSignal;
};

/**
 * The executor function for an authorized or unauthorized API method. If the
 * API function takes no input then there must be no parameter.
 */
type ClientMethod<Input, Output> = {} extends Input
  ? ((input?: undefined, options?: ClientMethodOptions) => Promise<Output>)
  : ((input: Input, options?: ClientMethodOptions) => Promise<Output>);

/**
 * To start a subscription we give the server some input and it responds with
 * a “subscribed” message along with any messages from that subscription.
 */
type ClientSubscription<Input, Message> = (input: Input) => Stream<Message>;

/**
 * Creates an API client based on the schema we were provided.
 */
function buildClient(
  config: APIClientConfig,
  path: Array<string>,
  schema: SchemaBase,
): Client<SchemaBase> {
  switch (schema.kind) {
    case SchemaKind.NAMESPACE:
      return buildClientNamespace(config, path, schema);
    case SchemaKind.METHOD:
    case SchemaKind.METHOD_UNAUTHORIZED:
      return buildClientMethod(config, path, schema);
    case SchemaKind.SUBSCRIPTION:
      return buildSubscription(config, path, schema);
    default: {
      const never: never = schema;
      throw new Error(`Unrecognized schema kind: ${never["kind"]}`);
    }
  }
}

/**
 * Builds our API client for a namespace schema. Mirrors the structure of the
 * namespace and recursively calls `buildClient()`.
 */
function buildClientNamespace<
  Schemas extends {readonly [key: string]: SchemaBase}
>(
  config: APIClientConfig,
  path: Array<string>,
  namespaceSchema: SchemaNamespace<Schemas>,
): ClientNamespace<Schemas> {
  // Create an empty object which we will put our namespace entries into. Use an
  // object with no prototype to avoid prototype-jacking.
  const client: any = Object.create(null);

  // Loop through all the entries in our namespace and add their schema to
  // our client.
  for (const [key, schema] of Object.entries(namespaceSchema.schemas)) {
    path.push(key);
    client[key] = buildClient(config, path, schema);
    path.pop();
  }

  return client;
}

/**
 * Build an executor function for an unauthorized method using the current
 * API schema path and the actual schema for this method.
 */
function buildClientMethod<
  Input extends JSONObjectValue,
  Output extends JSONObjectValue
>(
  config: APIClientConfig,
  path: Array<string>,
  schema: SchemaMethod<Input, Output> | SchemaMethodUnauthorized<Input, Output>,
): ClientMethod<Input, Output> {
  // The url to our method on the API server.
  const apiUrl = `${config.url}/${path.join("/")}`;

  // Is this an unauthorized method?
  const unauthorized = schema.kind === SchemaKind.METHOD_UNAUTHORIZED;

  return (async (
    input?: Input,
    options?: ClientMethodOptions,
  ): Promise<Output> => {
    // We may update the url and give it a query if this is a safe HTTP request
    // with some input.
    let url = apiUrl;

    // Create the fetch configuration. We will edit this configuration over time
    // to produce our request.
    const headers: {[key: string]: string} = {};
    const init: RequestInit = {
      // Use the `GET` method for safe requests.
      method: schema.safe === true ? "GET" : "POST",
      headers,
    };

    // If we have some input, then make sure to add it to our request. If this
    // is a safe method then add the input to the URL query. If this is not a
    // safe method then add the input as a JSON post body.
    if (input !== undefined) {
      if (schema.safe === true) {
        url += queryStringSerialize(input);
      } else {
        headers["Content-Type"] = "application/json";
        init.body = JSON.stringify(input);
      }
    }

    if (unauthorized === false) {
      // If an authentication function was provided then use it to fetch our
      // access token and set it as our `Authorization` header. The access token
      // may be returned synchronously.
      if (config.auth !== undefined) {
        let accessToken = config.auth();
        if (accessToken instanceof Promise) {
          accessToken = await accessToken;
        }
        if (accessToken !== null) {
          headers["Authorization"] = `Bearer ${accessToken}`;
        }
      }
    }

    // If we were given an `AbortSignal` then make sure to add that to our
    // `fetch()` configuration.
    if (options !== undefined && options.signal !== undefined) {
      init.signal = options.signal;
    }

    // Actually execute our request!
    const response = await fetch(url, init);

    // Parse the response body as JSON. We trust our server to return the
    // correct response so cast to `Output` directly without validating.
    const result: APIResult<Output> = await response.json();

    // If the response is ok then return our response data. If the response is
    // not ok then throw a new `APIError` with the error code.
    //
    // Note how we don’t look at the HTTP status code. Although we expect that
    // our API will always use a 200 status code when responding with `ok: true`
    // and a status code greater than or equal to 400 when responding
    // with `ok: false`.
    if (result.ok) {
      return result.data;
    } else {
      throw new APIError(result.error.code, result.error.serverStack);
    }
  }) as ClientMethod<Input, Output>;
}

/**
 * Serializes an input JSON object to a query string. We know the input value
 * is an object so we don’t need to support non-object inputs. Encodes both the
 * key and value as URI components. We first stringify the value to JSON.
 *
 * If a one of the properties is an array then we add that property multiple
 * times to the query string. For example:
 *
 * ```
 * {a: 1, b: [2, 3, 4]}
 * ```
 *
 * Would serialize into:
 *
 * ```
 * ?a=1&b=2&b=3&b=4
 * ```
 */
function queryStringSerialize(input: JSONObjectValue): string {
  const query: Array<string> = [];
  for (const [key, value] of Object.entries(input)) {
    const encodedKey = encodeURIComponent(key);
    if (Array.isArray(value)) {
      for (let i = 0; i < value.length; i++) {
        const encodedValue = queryStringValueSerialize(value[i]);
        query.push(`${encodedKey}=${encodedValue}`);
      }
    } else {
      const encodedValue = queryStringValueSerialize(value);
      query.push(`${encodedKey}=${encodedValue}`);
    }
  }
  return query.length > 0 ? "?" + query.join("&") : "";
}

/**
 * JSON stringifies all values except for strings that start with a letter and
 * aren’t a JSON keyword.
 */
function queryStringValueSerialize(value: JSONValue): string {
  if (typeof value === "string" && !isSyntaxJSON(value)) {
    return encodeURIComponent(value);
  } else {
    return encodeURIComponent(JSON.stringify(value));
  }
}

/**
 * Basic check to see if the value is [JSON][1]. May return true for some values
 * which are malformed JSON.
 *
 * In our query string format any string that is not JSON syntax is sent as a
 * raw string. We use this function to determine if a string does or does not
 * contain JSON syntax.
 *
 * [1]: https://json.org
 */
export function isSyntaxJSON(value: string): boolean {
  return (
    value === "true" ||
    value === "false" ||
    value === "null" ||
    value[0] === "{" ||
    value[0] === "[" ||
    value[0] === '"' ||
    // adapted from https://stackoverflow.com/a/13340826/1568890
    /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/.test(value)
  );
}

/**
 * Builds an API client endpoint for subscriptions. The subscription endpoint
 * is a function that returns a stream. When the stream is subscribed we will
 * subscribe with the provided input on the server.
 */
function buildSubscription<
  Input extends JSONObjectValue,
  Message extends JSONObjectValue
>(
  config: APIClientConfig,
  path: Array<string>,
  _schema: SchemaSubscription<Input, Message>,
): ClientSubscription<Input, Message> {
  const subscription = APIClientSubscription.get(config);
  const fullPath = `/${path.join("/")}`;

  return input => {
    // Generate an ID for our subscription. We will use this ID to determine
    // which messages were meant for us. If we unsubscribe and then re-subscribe
    // then we will use the same ID.
    const subscriptionID = generateID<SubscriptionID>();

    // If the listener is null then that means our stream is currently
    // unsubscribed. If it is not null then our stream has at least
    // one subscriber.
    let listener: Listener<Message> | null = null;

    // We attach this listener to our stream of _all_ subscription messages from
    // the server. This listener serves to filter messages and forward them on
    // to our own listener.
    const serverListener: Listener<APIClientSubscriptionMessage> = {
      // Pass on messages for this subscription only...
      next(message) {
        if (listener === null) {
          throw new Error("Expected listener to not be null.");
        }
        switch (message.type) {
          case "message": {
            // If we get a message for our subscription then send that to our
            // listener assuming that it has the right type.
            if (message.id === subscriptionID) {
              listener.next(message.message as Message);
            }
            return;
          }
          case "subscribed": {
            // noop
            return;
          }
          default: {
            // noop, but use TypeScript’s `never` to make sure we’ve tested all
            // the cases above.
            const never: never = message;
            (_never => {})(never); // HACK: Make TypeScript accept the variable as used.
            return;
          }
        }
      },

      // Pass on error messages...
      error(error) {
        if (listener === null) {
          throw new Error("Expected listener to not be null.");
        }
        listener.error(error);
      },

      // Pass on completion messages...
      complete() {
        if (listener === null) {
          throw new Error("Expected listener to not be null.");
        }
        listener.complete();
      },
    };

    return xs.create({
      start(newListener) {
        // We expect there to only be one listener at a time. If XStream wants
        // to re-subscribe we expect it to call stop first.
        if (listener !== null) {
          throw new Error("Expected listener to be null.");
        }
        listener = newListener;

        // Subscribe with our given input! This won’t subscribe us immediately.
        // Eventually the server will send us a “subscribed” message to let us
        // know we are connected.
        subscription.publish({
          type: "subscribe",
          id: subscriptionID,
          path: fullPath,
          input,
        });

        // Our subscription stream is like a `map()` stream so make sure we
        // subscribe to the underlying stream so we can intercept
        // server messages.
        subscription.stream.addListener(serverListener);
      },
      stop() {
        // We expect that `start()` has been called before we can stop. Unset
        // the listener so we don’t send it any new messages.
        if (listener === null) {
          throw new Error("Expected listener to not be null.");
        }
        listener = null;

        // Let the server know that we don’t care about messages for this
        // subscription anymore. The server will release resources for this
        // subscription after this.
        subscription.publish({
          type: "unsubscribe",
          id: subscriptionID,
        });

        // We don’t care about messages from the server now so unsubscribe.
        subscription.stream.removeListener(serverListener);
      },
    });
  };
}

/**
 * Any message we might get from our subscription server without errors (which
 * are transformed into actual exceptions) and with messages to indicate when
 * the client connects and disconnects.
 */
type APIClientSubscriptionMessage = WithoutError<SubscriptionServerMessage>;

/**
 * Filters a message with type `"error"` out of a tagged union
 * like `SubscriptionServerMessage`.
 */
type WithoutError<Message> = Message extends {type: "error"} ? never : Message;

/**
 * The subscription client manages our WebSocket connection over the course of
 * the application’s life cycle.
 */
class APIClientSubscription {
  /** Associate subscription clients with a specific config object. */
  private static clients = new WeakMap<
    APIClientConfig,
    APIClientSubscription
  >();

  /**
   * Get a subscription client for a given config. Configs that are
   * referentially equal will return referentially equal subscription clients.
   * That way we only have one underlying WebSocket connection for each
   * API client.
   */
  public static get(config: APIClientConfig): APIClientSubscription {
    let client = this.clients.get(config);
    if (client === undefined) {
      client = new APIClientSubscription(config);
      this.clients.set(config, client);
    }
    return client;
  }

  /**
   * The WebSocket we use for communicating subscriptions in realtime.
   */
  private socket: WebSocket | null = null;

  /**
   * The current XStream listener we will send messages to.
   */
  private listener: Listener<APIClientSubscriptionMessage> | null = null;

  /**
   * A stream which emits messages sent from the server as we receive them.
   * Subscribe to this stream to listen for the messages.
   *
   * If we get an error message from the server then we turn it into an
   * `APIError` and
   */
  public readonly stream: Stream<APIClientSubscriptionMessage>;

  /**
   * When the WebSocket closes we try to re-open it since we expect our
   * WebSocket with the server to live forever. This timer, created by
   * `setTimeout`, can be used to cancel a retry.
   */
  private retryTimeout: number | null = null;

  private constructor(private readonly config: APIClientConfig) {
    // Create the message stream...
    this.stream = xs.create({
      start: listener => {
        if (this.listener !== null) {
          throw new Error("Expected listener to be null.");
        }
        this.listener = listener;
        this.ensureSocket();
      },
      stop: () => {
        if (this.listener === null) {
          throw new Error("Expected listener to not be null.");
        }
        this.listener = null;
      },
    });
  }

  /**
   * Makes sure that a socket exists. If a socket does not exist then we create
   * one. If a socket does exist then we return it.
   */
  private ensureSocket(): WebSocket {
    // If we scheduled a retry then cancel it since we are retrying right now!
    if (this.retryTimeout !== null) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }

    // We already have the socket. We don’t need to connect a new one.
    if (this.socket !== null) {
      return this.socket;
    }

    // We will modify the URL given to us in configuration to get the right
    // WebSocket URL.
    let url = this.config.url;

    // If this is an absolute path then add the origin of the page to the URL.
    if (url.startsWith("/")) {
      url = window.location.origin + url;
    }

    // If the URL is using the HTTP protocol then let’s switch to the WS
    // protocol. This works for both HTTP to WS and HTTPS to WSS.
    if (url.startsWith("http")) {
      url = "ws" + url.slice(4);
    }

    // Start our connection with the modified URL!
    this.socket = new WebSocket(url);

    // When we get a message we parse the message as JSON and send it to
    // our listener.
    this.socket.addEventListener("message", event => {
      try {
        // Parse the message from our server as JSON. Assume that our server
        // gave us a correctly formatted subscription message.
        const rawMessage = event.data as unknown;
        if (typeof rawMessage !== "string") {
          throw new Error("Expected string.");
        }
        const message: SubscriptionServerMessage = JSON.parse(rawMessage);

        switch (message.type) {
          // If our message was an error then convert it to an `APIError` and
          // throw instead of passing the error on to our listener.
          case "error": {
            throw new APIError(message.error.code, message.error.serverStack);
          }
          default: {
            // If we have a listener then send it the message...
            if (this.listener !== null) {
              this.listener.next(message);
            }
            break;
          }
        }
      } catch (error) {
        handleError(error);
      }
    });

    // Forward any errors to our listener. If we have no listener then treat
    // the error as an unhandled error.
    this.socket.addEventListener("error", () => {
      handleError(new Error("WebSocket connection closed unexpectedly."));
    });

    // If the socket closes before we’ve stopped the producer, then try to
    // re-connect! The WebSocket closing does not mean there will be no more
    // events. It more likely means the internet temporarily disconnected.
    this.socket.addEventListener("close", () => {
      this.socket = null;

      // If the WebSocket closes unexpectedly then after some delay we try to
      // re-connect.
      if (this.listener !== null && this.retryTimeout === null) {
        this.retryTimeout = setTimeout(() => {
          this.retryTimeout = null;

          if (this.listener !== null) {
            this.ensureSocket();
          }
        }, 1000);
      }
    });

    /**
     * Handles an error by sending it to our listener or reporting it internally
     * if there are no listeners to handle the error.
     */
    const handleError = (error: unknown) => {
      if (this.listener !== null) {
        this.listener.error(error);
      } else {
        console.error(error); // eslint-disable-line no-console
      }
    };

    return this.socket;
  }

  /**
   * Publishes a message to our WebSocket. If our WebSocket is not yet open then
   * we will wait until it opens to send the message.
   */
  public publish(message: SubscriptionClientMessage) {
    const socket = this.ensureSocket();

    if (socket.readyState === WebSocket.CONNECTING) {
      function handleOpen() {
        socket.removeEventListener("open", handleOpen);
        socket.send(JSON.stringify(message));
      }

      socket.addEventListener("open", handleOpen);
    } else {
      socket.send(JSON.stringify(message));
    }
  }
}
