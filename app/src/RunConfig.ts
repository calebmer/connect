import {Platform} from "react-native";

/**
 * The type of `ENVIRONMENT`.
 */
export enum Environment {
  WEB = "WEB",
  WEB_SERVER = "WEB_SERVER",
  NATIVE = "NATIVE",
}

/**
 * The current environment we are in. Currently our app runs in
 * three environments.
 *
 * 1. **Web:** This is a web browser. Anything from Chrome to IE 11.
 * 2. **Web Server:** Our web code is first rendered on the server in Node.js
 *    powered by Next.js before being sent to the browser.
 * 3. **Native:** The app runs as a native app on iOS and Android devices with
 *    React Native.
 *
 * That’s a lot of variability in the environment! We use the `ENVIRONMENT`
 * configuration to figure out where, precisely, we are running.
 *
 * The `ENVIRONMENT` configuration differs from `Platform.OS` in that it
 * describes the specific build configuration for the code. We have separate
 * builds for each of these three environments and this variable is a way to
 * get at that data at runtime.
 */
export const ENVIRONMENT =
  Platform.OS === "web"
    ? (process as any).browser
      ? Environment.WEB
      : Environment.WEB_SERVER
    : Environment.NATIVE;
