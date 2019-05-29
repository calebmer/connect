import {Alert, Platform} from "react-native";
import {APIError} from "@connect/api-client";
import {AppError} from "../api/AppError";
import {logError} from "../utils/logError";

export const ErrorAlert = {
  /**
   * Displays an error to the user as a dismissible alert. We will also log the
   * error to the console for debugging. An error alert out of nowhere makes
   * little sense, so it’s important to add a “context message” to explain why
   * the user is seeing an alert.
   *
   * Currently uses the native alert on all platforms. On web we should probably
   * implement this as some kind of dismissible banner.
   */
  alert(error: unknown, contextMessage: string) {
    // Don’t show the React error overlay if we’ve caught the error.
    if (__DEV__ && (error instanceof AppError || error instanceof APIError)) {
      (error as any).disableReactErrorOverlay = true;
    }

    // Log the error to the console for debugging...
    logError(error);

    // Display the error to the user as an alert...
    if (Platform.OS === "web") {
      // TODO: Use something better than `alert()` on web.
      //
      // eslint-disable-next-line no-alert
      alert(contextMessage + ":\n" + AppError.displayMessage(error));
    } else {
      Alert.alert(contextMessage, AppError.displayMessage(error));
    }
  },
};
