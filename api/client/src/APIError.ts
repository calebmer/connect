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
   * When a person tries to sign up and the email they provided is already in
   * use by another account then we’ll throw this error.
   */
  SIGN_UP_EMAIL_ALREADY_USED = "SIGN_UP_EMAIL_ALREADY_USED",

  /**
   * When a person tries to sign into their account but they provide the wrong
   * email and password combination. We don’t tell the person if its their email
   * that’s wrong or their password since that might be a security violation.
   */
  SIGN_IN_INCORRECT_EMAIL_PASSWORD = "SIGN_IN_INCORRECT_EMAIL_PASSWORD",

  /**
   * Tried to automatically refresh an access token with a refresh token, but
   * the refresh token was invalid. Either it was revoked or never existed.
   */
  REFRESH_TOKEN_INVALID = "REFRESH_TOKEN_INVALID",

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
}

/**
 * The result of an API request. Either the request was successful and we return
 * `ok: true` or the request failed and we return `ok: false` alongside an
 * error code.
 *
 * NOTE: We nest the error code into `error.code` because in the future we might
 * want some errors to include extra data.
 */
export type APIResult<Data> =
  | {
      readonly ok: true;
      readonly data: Data;
    }
  | {
      readonly ok: false;
      readonly error: {readonly code: APIErrorCode};
    };
