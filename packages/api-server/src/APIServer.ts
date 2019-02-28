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

/**
 * The HTTP server for our API. Powered by Express.
 */
const APIServer = express();
APIServer.set("x-powered-by", false);

// Parse JSON HTTP bodies.
APIServer.use(express.json());

// Initialize our `APIServer` using our `APISchema`. This will add all the
// routes we need to our Express server.
initializeServer([], APISchema);

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
 * Initializes the server with any kind of API schema.
 */
function initializeServer(path: Array<string>, schema: SchemaBase): void {
  switch (schema.kind) {
    case SchemaKind.NAMESPACE:
      return initializeServerNamespace(path, schema);
    case SchemaKind.METHOD_UNAUTHORIZED:
      return initializeServerMethodUnauthorized(path, schema);
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
function initializeServerNamespace(
  path: Array<string>,
  namespaceSchema: SchemaNamespace<{readonly [key: string]: SchemaBase}>,
): void {
  // Loop through all the entries in our namespace and add their schema to
  // our client.
  for (const [key, schema] of Object.entries(namespaceSchema.schemas)) {
    path.push(key);
    initializeServer(path, schema);
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

    next(new Error("TODO"));
  });
}
