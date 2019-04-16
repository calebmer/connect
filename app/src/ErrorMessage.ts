import {APIError, APIErrorCode} from "@connect/api-client";

/**
 * Displays a human-readable message for an unknown error.
 */
export function displayErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return displayErrorCodeMessage(error.code);
  } else {
    // If we have an error that is not an `APIError` then it is unexpected. Log
    // the error to our console for debugging.
    if (error instanceof Error) {
      console.error(error.stack); // eslint-disable-line no-console
    }

    return displayErrorCodeMessage(APIErrorCode.UNKNOWN);
  }
}

/**
 * Displays an error message to the user based on the error code.
 */
function displayErrorCodeMessage(errorCode: APIErrorCode): string {
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
    case APIErrorCode.UNKNOWN: {
      let message = "Uh oh! Something unexpected went wrong.";

      // Display the error code with the message in development.
      if (process.env.NODE_ENV === "development") {
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

      // Use an unknown error message for the user.
      return displayErrorCodeMessage(APIErrorCode.UNKNOWN);
    }
  }
}

const unrecognizedErrorCodes = new Set<string>();
