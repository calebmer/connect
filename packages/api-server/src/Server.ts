import chalk from "chalk";
import * as express from "express";
import {Response} from "express";
import {HttpError, BadRequest} from "http-errors";
import * as APIClient from "@connect/api-client";
import {APISchemaKeys} from "./APISchema";
import {APIDefinition} from "./APIDefinition";
import {withDatabase} from "./Database";

/**
 * The HTTP server for our API. Powered by Express.
 */
const Server = express();
Server.set("x-powered-by", false);

// Parse JSON HTTP bodies.
Server.use(express.json());

// Add routes to our app by looking at all of the schemas expected by
// `APIClient` and adding them to our Express app.
for (const key of APISchemaKeys) {
  // Get the schema and definition function for this operation.
  const schema = APIClient[key].schema;
  const definition = APIDefinition[key];

  // Add this operation to our server.
  Server.post(schema.path, (request, response) => {
    try {
      // First, validate that the request input is in the correct format.
      if (!APIClient.validateObject(schema.input, request.body)) {
        throw new BadRequest("Invalid input.");
      }
      // Execute the operation function with a database connection. If
      // successful then return 200 with the data. If the operation fails then
      // handle the error.
      withDatabase(database => definition(database, request.body as any)).then(
        output => response.status(200).json(output),
        error => handleError(response, error),
      );
    } catch (error) {
      handleError(response, error);
    }
  });
}

/**
 * Handles an error thrown by our JavaScript code. If the error is an
 * `HttpError` then we will use the status code from that error along with the
 * message from that error. If the error is one we don’t recognize then we
 * return a status code of 500 and an internal server error message.
 *
 * Remember that this is only how we handle unexpected errors! Expected errors
 * that we want to report in the UI should be returned from the
 * operation directly.
 */
function handleError(response: Response, error: unknown): void {
  // In development, print the error stack trace to stderr for debugging.
  if (process.env.NODE_ENV === "development") {
    if (error instanceof Error) {
      console.error(chalk.red(error.stack || "")); // eslint-disable-line no-console
    }
  }

  if (error instanceof HttpError) {
    response.status(error.statusCode).json({message: error.message});
  } else {
    response.status(500).json({message: "Internal server error."});
  }
}

// Actually export the server now.
export {Server};
