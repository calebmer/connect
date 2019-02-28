import * as express from "express";
import chalk from "chalk";
import {Request, Response, NextFunction} from "express";
import {
  SchemaBase,
  SchemaNamespace,
  JSONObjectValue,
  SchemaMethodUnauthorized,
  SchemaKind,
  APIError,
  APIErrorCode,
  APISchema,
  APIResult,
} from "@connect/api-client";
import {withDatabase, Database} from "./Database";
import * as _APIServerDefinition from "./methods";

/**
 * The HTTP server for our API. Powered by Express.
 */
const APIServer = express();
APIServer.set("x-powered-by", false);

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
 * Initializes the server with a method that does not need authorization.
 */
function initializeServerMethodUnauthorized<
  MethodInputValue extends JSONObjectValue
>(
  path: Array<string>,
  definition: ServerMethodUnauthorized<MethodInputValue>,
  schema: SchemaMethodUnauthorized<MethodInputValue>,
): void {
  // The path to this API method.
  const apiPath = `/${path.join("/")}`;

  // Register this method on our API server. When this method is executed we
  // will call the appropriate function.
  APIServer.post(apiPath, (request, response, next) => {
    // Get the input from our request body.
    const input = request.body;

    // Validate that the input from our request body is correct. If the input
    // is not correct then throw an API error.
    if (!schema.input.validate(input)) {
      throw new APIError(APIErrorCode.BAD_INPUT);
    }

    // Provides a database to our API method definition.
    withDatabase(database => definition(database, input)).then(
      _output => {
        // Construct the successful result of an API request.
        const result: APIResult<null> = {
          ok: true,
          data: null,
        };
        // Send the successful result to our client.
        response.status(200).json(result);
      },

      // If the method failed then forward to our Express error handler!
      error => next(error),
    );
  });
}

// Add a fallback handler for any unrecognized method.
APIServer.use((_request: Request, response: Response) => {
  response.statusCode = 404;
  throw new APIError(APIErrorCode.UNRECOGNIZED_METHOD);
});

// Add an error handler.
APIServer.use(
  (
    error: unknown,
    _request: Request,
    response: Response,
    next: NextFunction,
  ) => {
    // If the headers have already been sent, let Express handle the error.
    if (response.headersSent) {
      next(error);
      return;
    }

    // In development, print the error stack trace to stderr for debugging.
    if (process.env.NODE_ENV === "development") {
      if (error instanceof Error) {
        console.error(chalk.red(error.stack || "")); // eslint-disable-line no-console
      }
    }

    // If the response status code is not an error status code then we need to
    // set one. If the error is an instance of `APIError` then the error is the
    // client’s fault (400) otherwise it’s our fault (500).
    if (!(response.statusCode >= 400 && response.statusCode < 600)) {
      response.statusCode = error instanceof APIError ? 400 : 500;
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
        error: {code: APIErrorCode.INTERNAL},
      };
    }

    // Send our error response!
    response.json(result);
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
  : Schema extends SchemaMethodUnauthorized<infer MethodInputValue>
  ? ServerMethodUnauthorized<MethodInputValue>
  : never;

/**
 * Creates the type of a namespace for the API server.
 */
type ServerNamespace<Schemas extends {readonly [key: string]: SchemaBase}> = {
  readonly [Key in keyof Schemas]: Server<Schemas[Key]>
};

/**
 * The type of a server-side definition for an unauthorized method. It takes the
 * method input and some unauthorized context.
 */
type ServerMethodUnauthorized<MethodInputValue> = (
  database: Database,
  input: MethodInputValue,
) => Promise<unknown>;
