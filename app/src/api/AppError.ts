import {APIError, APIErrorCode} from "@connect/api-client";

const unexpectedErrorMessage = "Uh oh! Something unexpected went wrong.";

/**
 * A custom `Error` class specifically for application errors. Thrown by the
 * application with a custom message.
 *
 * The message you provide to an `AppError` _will_ be shown to the user!
 */
export class AppError extends Error {
  constructor(message: string) {
    super(message);

    // Maintains proper stack trace for where our error was thrown
    // (only available on V8).
    if ((Error as any).captureStackTrace) {
      (Error as any).captureStackTrace(this, AppError);
    }
  }

  /**
   * Displays a human-readable message for any error object.
   */
  public static displayMessage(error: unknown) {
    if (error instanceof AppError) {
      return error.message;
    } else if (error instanceof APIError) {
      return apiErrorDisplayMessage(error.code);
    } else {
      return unexpectedErrorMessage;
    }
  }
}

/**
 * Displays an error message to the user based on the error code.
 */
function apiErrorDisplayMessage(errorCode: APIErrorCode): string {
  switch (errorCode) {
    case APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED:
      return "An account with this email address already exists.";

    case APIErrorCode.SIGN_IN_UNRECOGNIZED_EMAIL:
      return "There is no account with this email address.";

    case APIErrorCode.SIGN_IN_INCORRECT_PASSWORD:
      return "Incorrect password.";

    case APIErrorCode.UNAUTHORIZED:
      return "You are not allowed to access this resource. Please try signing in.";

    case APIErrorCode.NOT_FOUND:
      return "Could not find the requested resource.";

    case APIErrorCode.ALREADY_EXISTS:
      return "The resource you tried to create already exists.";

    case APIErrorCode.BAD_INPUT:
    case APIErrorCode.UNRECOGNIZED_METHOD:
    case APIErrorCode.ACCESS_TOKEN_EXPIRED:
    case APIErrorCode.REFRESH_TOKEN_INVALID:
    case APIErrorCode.CHAOS_MONKEY:
    case APIErrorCode.UNKNOWN: {
      let message = unexpectedErrorMessage;

      // Display the error code with the message in development.
      if (__DEV__) {
        message += ` (APIErrorCode.${errorCode})`;
      }

      return message;
    }

    default: {
      // Check statically, via TypeScript, that all API error codes are handled
      // by this function!
      const unrecognizedErrorCode: never = errorCode;

      // If this is an unrecognized error code then log an error to our console.
      // Don’t log an error more than once though.
      if (!unrecognizedErrorCodes.has(unrecognizedErrorCode)) {
        unrecognizedErrorCodes.add(unrecognizedErrorCode);
        console.error(`Unrecognized error code: ${unrecognizedErrorCode}`); // eslint-disable-line no-console
      }

      let message = unexpectedErrorMessage;

      // Display the error code with the message in development.
      if (__DEV__) {
        message += ` (APIErrorCode.${errorCode})`;
      }

      return message;
    }
  }
}

const unrecognizedErrorCodes = new Set<string>();
