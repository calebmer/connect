import {APIClient} from "@connect/api-client";

/**
 * A web instance of our API client.
 *
 * We use an API proxy for our API client on the web. To see the implementation
 * of our API proxy look for the file `APIProxy.js`. In our native API client we
 * use `AsyncStorage` to store our API tokens. However, `AsyncStorage` is not
 * secure on the web! An XSS attack can get ahold of tokens which allows an
 * attacker to impersonate an account forever.
 */
export const API = APIClient.create({
  url: "/api",
});
