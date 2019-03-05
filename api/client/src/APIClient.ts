import {APIError, APIResult} from "./APIError";
import {
  SchemaBase,
  SchemaKind,
  SchemaMethod,
  SchemaMethodUnauthorized,
  SchemaNamespace,
} from "./Schema";
import {APISchema} from "./APISchema";
import {JSONObjectValue} from "./JSONValue";

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
    return createClient(config, [], APISchema) as any;
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
};

/**
 * Used for authenticating an account with the API. The `APIAuth` object will
 * have a different implementation on every platform.
 */
export interface APIAuth {
  /**
   * Get the access token for our API. If we return void then this platform
   * does not use access tokens directly. For example, calls to the API from the
   * web go through an API proxy that adds the access token from a cookie.
   */
  getAccessToken(): string | void;
}

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
  ? ClientMethodUnauthorized<Input, Output>
  : never;

/**
 * The type of a namespace for the API client.
 */
type ClientNamespace<Schemas extends {readonly [key: string]: SchemaBase}> = {
  readonly [Key in keyof Schemas]: Client<Schemas[Key]>
};

/**
 * The executor function for an authorized API method.
 */
type ClientMethod<Input, Output> = (
  auth: APIAuth,
  input: Input,
) => Promise<Output>;

/**
 * The executor function for an unauthorized API method.
 */
type ClientMethodUnauthorized<Input, Output> = (
  input: Input,
) => Promise<Output>;

/**
 * Creates an API client based on the schema we were provided.
 */
function createClient(
  config: APIClientConfig,
  path: Array<string>,
  schema: SchemaBase,
): Client<SchemaBase> {
  switch (schema.kind) {
    case SchemaKind.NAMESPACE:
      return createClientNamespace(config, path, schema);
    case SchemaKind.METHOD:
      return createClientMethod(config, path, schema);
    case SchemaKind.METHOD_UNAUTHORIZED:
      return createClientMethodUnauthorized(config, path, schema);
    default: {
      const never: never = schema;
      return never;
    }
  }
}

/**
 * Creates our API client for a namespace schema. Mirrors the structure of the
 * namespace and recursively calls `createClient()`.
 */
function createClientNamespace<
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
    client[key] = createClient(config, path, schema);
    path.pop();
  }

  return client;
}

/**
 * Creates an executor function for an unauthorized method using the current
 * API schema path and the actual schema for this method.
 */
function createClientMethod<
  Input extends JSONObjectValue,
  Output extends JSONObjectValue
>(
  config: APIClientConfig,
  path: Array<string>,
  _schema: SchemaMethod<Input, Output>,
): ClientMethod<Input, Output> {
  // The path to our method on the API server.
  const apiPath = `${config.url}/${path.join("/")}`;

  return async (auth: APIAuth, input: Input) => {
    // Create the headers object for an authorized client method.
    const headers: {[key: string]: string} = {
      "Content-Type": "application/json",
    };

    // Use our auth object to get the access token for our
    // `Authorization` header.
    const accessToken = auth.getAccessToken();
    if (accessToken !== undefined) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // All methods are executed with a `POST` request. HTTP semantics don’t
    // matter a whole lot to our API.
    const response = await fetch(apiPath, {
      method: "POST",
      headers,
      body: JSON.stringify(input),
    });

    // Parse the response body as JSON. We trust our server to return the
    // correct response so cast to `Output` directly without validating.
    const result: APIResult<Output> = await response.json();

    // If the response is ok then return our response data. If the response is
    // not ok then throw a new `APIError` with the error code.
    if (result.ok) {
      return result.data;
    } else {
      throw new APIError(result.error.code);
    }
  };
}

/**
 * Creates an executor function for an unauthorized method using the current
 * API schema path and the actual schema for this method.
 */
function createClientMethodUnauthorized<
  Input extends JSONObjectValue,
  Output extends JSONObjectValue
>(
  config: APIClientConfig,
  path: Array<string>,
  _schema: SchemaMethodUnauthorized<Input, Output>,
): ClientMethodUnauthorized<Input, Output> {
  // The path to our method on the API server.
  const apiPath = `${config.url}/${path.join("/")}`;

  return async (input: Input) => {
    // All methods are executed with a `POST` request. HTTP semantics don’t
    // matter a whole lot to our API.
    const response = await fetch(apiPath, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(input),
    });

    // Parse the response body as JSON. We trust our server to return the
    // correct response so cast to `Output` directly without validating.
    const result: APIResult<Output> = await response.json();

    // If the response is ok then return our response data. If the response is
    // not ok then throw a new `APIError` with the error code.
    if (result.ok) {
      return result.data;
    } else {
      throw new APIError(result.error.code);
    }
  };
}
