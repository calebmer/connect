/**
 * All the error codes returned by our API.
 *
 * IMPORTANT: You can change the name of an error code in source code (the name
 * on the left-hand-side) but you can’t change the string representation of the
 * error code (the name on the right-hand-side) since we might have old apps
 * living in the wild that depend on that error code for
 * backwards compatibility.
 */
export enum APIErrorCode {
  /**
   * Tried to provide input in the incorrect format to our API.
   */
  BAD_INPUT = "BAD_INPUT",

  /**
   * Tried to call a method unrecognized by our API.
   */
  UNRECOGNIZED_METHOD = "UNRECOGNIZED_METHOD",

  /**
   * A person is unauthorized to perform some action that they were trying to
   * perform. This error message is intentionally opaque. The person is not
   * always allowed to know why they were unauthorized.
   */
  UNAUTHORIZED = "UNAUTHORIZED",

  /**
   * The requested resource could not be found.
   */
  NOT_FOUND = "NOT_FOUND",

  /**
   * The user tried to _create_ a new resource that already exists! Perhaps by
   * choosing a unique ID that was already in use.
   */
  ALREADY_EXISTS = "ALREADY_EXISTS",

  /**
   * A person’s access token expired. They should use their refresh token to get
   * a new one.
   */
  ACCESS_TOKEN_EXPIRED = "ACCESS_TOKEN_EXPIRED",

  /**
   * Tried to automatically refresh an access token with a refresh token, but
   * the refresh token was invalid. Either it was revoked or never existed.
   */
  REFRESH_TOKEN_INVALID = "REFRESH_TOKEN_INVALID",

  /**
   * When a person tries to sign up and the email they provided is already in
   * use by another account then we’ll throw this error.
   *
   * A special version of `ALREADY_EXISTS`.
   */
  SIGN_UP_EMAIL_ALREADY_USED = "SIGN_UP_EMAIL_ALREADY_USED",

  /**
   * When a person tries to sign into their account but they provide an email
   * which is not recognized.
   */
  SIGN_IN_UNRECOGNIZED_EMAIL = "SIGN_IN_UNRECOGNIZED_EMAIL",

  /**
   * When a person tries to sign into their account but they provide the wrong
   * password combination.
   */
  SIGN_IN_INCORRECT_PASSWORD = "SIGN_IN_INCORRECT_PASSWORD",

  /**
   * In development, we intentionally throw this error so that developers are
   * forced to think about the error state of their code.
   */
  CHAOS_MONKEY = "CHAOS_MONKEY",

  /**
   * An unknown error occurred.
   */
  UNKNOWN = "UNKNOWN",
}

/**
 * A custom `Error` class specifically for API errors. Thrown by the client and
 * server when there’s an API error.
 */
export class APIError extends Error {
  /**
   * Get the HTTP status code of any error.
   */
  public static statusCode(error: unknown): number {
    if (error instanceof APIError) {
      return error.statusCode();
    } else {
      return (error as any).statusCode ? (error as any).statusCode : 500;
    }
  }

  /**
   * Converts any error object to a JSON object that we can send over
   * the network.
   */
  public static toJSON(
    error: unknown,
  ): {code: APIErrorCode; serverStack?: string} {
    return {
      // If this is not an API error then we don’t know its code.
      code: error instanceof APIError ? error.code : APIErrorCode.UNKNOWN,

      // If we are in development mode then include the stack of our error
      // from the server. This should help in debugging why an error ocurred.
      serverStack:
        process.env.NODE_ENV === "development" && error instanceof Error
          ? error.stack
          : undefined,
    };
  }

  /**
   * The code for this error.
   */
  public readonly code: APIErrorCode;

  constructor(code: APIErrorCode) {
    super(`API error: ${code}`);

    // Maintains proper stack trace for where our error was thrown
    // (only available on V8).
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, APIError);
    }

    this.code = code;
  }

  /**
   * The HTTP status code of this error.
   */
  public statusCode(): number {
    switch (this.code) {
      case APIErrorCode.UNAUTHORIZED:
      case APIErrorCode.ACCESS_TOKEN_EXPIRED:
        return 401;
      case APIErrorCode.NOT_FOUND:
        return 404;
      case APIErrorCode.CHAOS_MONKEY:
        return 500;
      default:
        return 400;
    }
  }
}

/**
 * The result of an API request. Either the request was successful and we return
 * `ok: true` or the request failed and we return `ok: false` alongside an
 * error code.
 *
 * In development we include the stack of the error on the server.
 */
export type APIResult<Data> =
  | {
      readonly ok: true;
      readonly data: Data;
    }
  | {
      readonly ok: false;
      readonly error: {
        readonly code: APIErrorCode;
        readonly serverStack?: string;
      };
    };
