import {APIError, APIResult} from "./APIError";
import {JSONObjectValue, JSONValue} from "./JSONValue";
import {
  SchemaBase,
  SchemaKind,
  SchemaMethod,
  SchemaMethodUnauthorized,
  SchemaNamespace,
} from "./Schema";
import {APISchema} from "./APISchema";
import {AccessToken} from "./types/TokenTypes";

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
      // Log the server error if our result gave us the server’s error
      // stack trace.
      //
      // NOTE: We use `console.log()` since `console.error()` in React Native
      // will throw up a big red error box!
      if (result.error.serverStack) {
        console.log(`Server Error: ${result.error.serverStack}`); // eslint-disable-line no-console
      }

      throw new APIError(result.error.code);
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
function queryStringSerialize<Input extends JSONObjectValue>(
  input: Input,
): string {
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
function queryStringValueSerialize<Value extends JSONValue>(
  value: Value,
): string {
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
