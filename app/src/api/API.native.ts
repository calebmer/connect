// TODO: IMPORTANT: `AsyncStorage` is not secure! Use Expo’s
// `SecureStorage` instead! https://docs.expo.io/versions/v32.0.0/sdk/securestore/

import {APIClient, AccessToken, RefreshToken} from "@connect/api-client";
import AsyncStorage from "@react-native-community/async-storage";
import {NativeModules} from "react-native";
import jwtDecode from "jwt-decode";
import url from "url";

/** The URL our API is hosted at. */
let apiURL = "http://localhost:4000";

// In development, use the same host as our script for our API. This enables
// local API development.
if (__DEV__) {
  const {protocol, hostname} = url.parse(NativeModules.SourceCode.scriptURL);
  if (protocol && hostname) {
    apiURL = `${protocol}//${hostname}:4000`;
  }
}

/**
 * A React Native instance of our API client.
 */
export const API = APIClient.create({
  url: apiURL,
  auth: getAccessToken,
});

// Keys to access the access/refresh tokens in async storage.
const ACCESS_TOKEN_KEY = "@connect/app:accessToken";
const REFRESH_TOKEN_KEY = "@connect/app:refreshToken";

// The current state of authentication in our app. If the user is signed out
// then the current state will be `null`. Otherwise it will be an object with
// the appropriate tokens.
let currentState: {
  accessToken: AccessToken;
  refreshToken: RefreshToken;
  accessTokenExpiresAt: number | null;
} | null = null;

/**
 * Loads our access tokens from persistent storage. (Currently `AsyncStorage`.)
 * If we find some tokens then we update our internal state and return true
 * so that the caller knows an account is authenticated. Otherwise we return
 * false so that the caller knows we are not authenticated.
 */
export async function loadTokensFromStorage(): Promise<boolean> {
  // Load our tokens from our app storage. We assume this storage is private
  // and secure.
  const entries = await AsyncStorage.multiGet([
    ACCESS_TOKEN_KEY,
    REFRESH_TOKEN_KEY,
  ]);

  // Extract our tokens from the list of entries we fetched from app storage.
  let accessToken: AccessToken | undefined;
  let refreshToken: RefreshToken | undefined;
  for (let i = 0; i < entries.length; i++) {
    const [key, value] = entries[i];
    if (typeof value === "string") {
      if (key === ACCESS_TOKEN_KEY) accessToken = value as AccessToken;
      if (key === REFRESH_TOKEN_KEY) refreshToken = value as RefreshToken;
    }
  }

  // If we had both an access token and a refresh token in app storage then
  // update our state and return true.
  if (accessToken !== undefined && refreshToken !== undefined) {
    currentState = {
      accessToken: accessToken!,
      refreshToken: refreshToken!,
      accessTokenExpiresAt: null,
    };
    return true;
  } else {
    currentState = null;
    return false;
  }
}

/**
 * Gets an access token for our API if we are signed in. If the access token has
 * expired then use our refresh token to create a new one.
 */
function getAccessToken(): AccessToken | null | Promise<AccessToken | null> {
  // If we are signed in...
  if (currentState !== null) {
    // If we don’t know the expiration time of our access token, then decode
    // the access token and save the expiration time.
    if (currentState.accessTokenExpiresAt === null) {
      const expiresAt = jwtDecode<{exp: number}>(currentState.accessToken).exp;
      currentState.accessTokenExpiresAt = expiresAt;
    }

    // If our access token has expired (or it will expire in 30s from now to
    // account for network latency) then generate a new access token using our
    // refresh token.
    if (
      Math.floor(Date.now() / 1000) >=
      currentState.accessTokenExpiresAt - 30
    ) {
      return refreshAccessToken(currentState.refreshToken);
    }

    // Otherwise we have a valid, non-expired access token. Let’s use it!
    return currentState.accessToken;
  }

  return null;
}

/**
 * Generates a new access token using our refresh token. If we fail to generate
 * a new access token then we sign the user out.
 */
async function refreshAccessToken(
  refreshToken: RefreshToken,
): Promise<AccessToken> {
  let accessToken: AccessToken;
  try {
    // Send an API request to refresh our access token.
    //
    // NOTE: The API client does not call `getAccessToken()` on an unauthorized
    // method like `refreshAccessToken()`. Which is good because otherwise we
    // might loop forever as we’re making an API call in an API call.
    const data = await API.account.refreshAccessToken({refreshToken});
    accessToken = data.accessToken;
  } catch (error) {
    // If we fail to refresh our access token then sign the user out!
    currentState = null;
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);
    throw error;
  }

  // Update our current state with the new access token and save it in async
  // storage so that when the app restarts we can restore the user’s session.
  currentState = {accessToken, refreshToken, accessTokenExpiresAt: null};
  await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  return accessToken;
}

// Override `API.account.signIn` so that we save the access token and refresh
// token to async storage after the method successfully finishes executing.
const signIn = API.account.signIn;
(API as any).account.signIn = async (input: any, options: any) => {
  const {accessToken, refreshToken} = await signIn(input, options);
  currentState = {accessToken, refreshToken, accessTokenExpiresAt: null};
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
  return {accessToken: "", refreshToken: ""};
};

// Override `API.account.signUp` so that we save the access token and refresh
// token to async storage after the method successfully finishes executing.
const signUp = API.account.signUp;
(API as any).account.signUp = async (input: any, options: any) => {
  const {accessToken, refreshToken} = await signUp(input, options);
  currentState = {accessToken, refreshToken, accessTokenExpiresAt: null};
  await AsyncStorage.multiSet([
    [ACCESS_TOKEN_KEY, accessToken],
    [REFRESH_TOKEN_KEY, refreshToken],
  ]);
  return {accessToken: "", refreshToken: ""};
};

// Override `API.account.signOut` so that we send the refresh token from our
// local storage to the API and so that we purge our local state of all API
// request tokens.
//
// Ignore the input. We will be using the refresh token from our local storage.
const signOut = API.account.signOut;
(API as any).account.signOut = async (_input: any, options: any) => {
  // Get the current refresh token from our state.
  let refreshToken: RefreshToken | undefined;
  if (currentState !== null) {
    refreshToken = currentState.refreshToken;
  }

  // Clear our current state and async storage of all API tokens whether or not
  // our actual API request fails or succeeds.
  currentState = null;
  await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY]);

  // Send a request to our API to destroy the refresh token using our original
  // `signOut` method before we wrapped it in this function.
  if (refreshToken !== undefined) {
    await signOut({refreshToken}, options);
  }

  // Successfully signed out!
  return {};
};
