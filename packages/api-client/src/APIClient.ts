import {JSONObjectValue} from "./JSONValue";
import {
  SchemaMethodUnauthorized,
  SchemaBase,
  SchemaNamespace,
  SchemaKind,
} from "./Schema";
import {APIError, APIResult} from "./APIError";
import {APISchema} from "./APISchema";

/**
 * The root url of our API. In development one may choose to use a local API
 * endpoint instead of a production API endpoint.
 */
const apiUrl = "http://localhost:4000";

/**
 * Our API client. Allows us to execute requests against our API server using
 * the declaration from our API server.
 *
 * Thanks to TypeScript being awesome `APISchema` gets documentation, jump to
 * definition, and find references all for free!
 */
export const API: Client<typeof APISchema> = createClient([], APISchema) as any;

/**
 * Creates the type for an API client based on its schema.
 */
type Client<
  Schema extends SchemaBase
> = Schema extends SchemaNamespace<infer Schemas> // prettier-ignore
  ? ClientNamespace<Schemas>
  : Schema extends SchemaMethodUnauthorized<infer MethodInputValue>
  ? ClientMethodUnauthorized<MethodInputValue>
  : never;

/**
 * The type of a namespace for the API client.
 */
type ClientNamespace<Schemas extends {readonly [key: string]: SchemaBase}> = {
  readonly [Key in keyof Schemas]: Client<Schemas[Key]>
};

/**
 * The executor function for an unauthorized API method.
 */
type ClientMethodUnauthorized<MethodInputValue> = (
  input: MethodInputValue,
) => Promise<unknown>;

/**
 * Creates an API client based on the schema we were provided.
 */
function createClient(
  path: Array<string>,
  schema: SchemaBase,
): Client<SchemaBase> {
  switch (schema.kind) {
    case SchemaKind.NAMESPACE:
      return createClientNamespace(path, schema);
    case SchemaKind.METHOD_UNAUTHORIZED:
      return createClientMethodUnauthorized(path, schema);
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
    client[key] = createClient(path, schema);
    path.pop();
  }

  return client;
}

/**
 * Creates an executor function for an unauthorized method using the current
 * API schema path and the actual schema for this method.
 */
function createClientMethodUnauthorized<
  MethodInputValue extends JSONObjectValue
>(
  path: Array<string>,
  _schema: SchemaMethodUnauthorized<MethodInputValue>,
): ClientMethodUnauthorized<MethodInputValue> {
  // The path to our method on the API server.
  const apiPath = `${apiUrl}/${path.join("/")}`;

  return async input => {
    // All methods are executed with a `POST` request. HTTP semantics don’t
    // matter a whole lot to our API.
    const response = await fetch(apiPath, {
      method: "POST",
      body: JSON.stringify(input),
    });

    // Parse the response body as JSON.
    const result: APIResult<unknown> = await response.json();

    // If the response is ok then return our response data. If the response is
    // not ok then throw a new `APIError` with the error code.
    if (result.ok) {
      return result.data;
    } else {
      throw new APIError(result.error.code);
    }
  };
}
