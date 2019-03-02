import {APIError, APIErrorCode} from "@connect/api-client";

/**
 * Displays a human-readable message for an unknown error.
 */
export function displayErrorMessage(error: unknown): string {
  if (error instanceof APIError) {
    return displayErrorCodeMessage(error.code);
  } else {
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

    case APIErrorCode.BAD_INPUT:
    case APIErrorCode.UNRECOGNIZED_METHOD:
    case APIErrorCode.REFRESH_TOKEN_INVALID:
    case APIErrorCode.UNKNOWN:
      return "An internal error occurred.";

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
