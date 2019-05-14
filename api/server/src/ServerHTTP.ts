/**
 * This module is responsible for binding our API definitions to the HTTP
 * protocol. We only do this for method API endpoints which have a clear
 * request/response life cycle.
 *
 * Includes Express middleware, API errors to HTTP status codes, query parsing,
 * HTTP authorization, and more.
 */

import {
  APIError,
  APIErrorCode,
  APIResult,
  JSONObjectValue,
  JSONValue,
  SchemaInput,
  SchemaInputArray,
  SchemaInputObject,
  SchemaMethod,
  SchemaMethodUnauthorized,
  isSyntaxJSON,
} from "@connect/api-client";
import {AccessTokenData, AccessTokenGenerator} from "./AccessToken";
import {DEV, TEST} from "./RunConfig";
import {ServerMethod, ServerMethodUnauthorized} from "./Server";
import express, {Express, NextFunction, Request, Response} from "express";
import {Context} from "./Context";
import {ParsedUrlQuery} from "querystring";
import jwt from "jsonwebtoken";
import {logError} from "./logError";
import morgan from "morgan";

/**
 * Adds some middleware to an Express HTTP server at the very beginning. There’s
 * also `initializeServerMiddlewareAfter` which will add middleware that runs
 * after any other middleware.
 */
export function initializeServerMiddlewareBefore(server: Express) {
  server.set("x-powered-by", false);
  server.set("etag", false);

  if (DEV) server.set("json spaces", 2);
  if (DEV) server.use(morgan("dev"));

  server.use(express.json());
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
export function initializeServerMethod<
  Input extends JSONObjectValue,
  Output extends JSONObjectValue
>(
  server: Express,
  path: ReadonlyArray<string>,
  definition: ServerMethod<Input, Output>,
  schema: SchemaMethod<Input, Output>,
): void {
  // The path to this API method.
  const apiPath = `/${path.join("/")}`;

  // Register this method on our API server. When this method is executed we
  // will call the appropriate function.
  server.use(
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
export function initializeServerMethodUnauthorized<
  Input extends JSONObjectValue,
  Output extends JSONObjectValue
>(
  server: Express,
  path: ReadonlyArray<string>,
  definition: ServerMethodUnauthorized<Input, Output>,
  schema: SchemaMethodUnauthorized<Input, Output>,
): void {
  // The path to this API method.
  const apiPath = `/${path.join("/")}`;

  // Register this method on our API server. When this method is executed we
  // will call the appropriate function.
  server.use(
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

/**
 * Adds some middleware to an Express HTTP server at the very end. There’s also
 * `initializeServerMiddlewareBefore` which will add middleware that runs before
 * any other middleware.
 */
export function initializeServerMiddlewareAfter(server: Express) {
  // Add a fallback handler for any unrecognized method.
  server.use((_req: Request, res: Response) => {
    res.statusCode = 404;
    throw new APIError(APIErrorCode.UNRECOGNIZED_METHOD);
  });

  // Add an error handler.
  server.use(
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
}
