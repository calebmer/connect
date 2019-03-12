import {APIClient} from "@connect/api-client";

/**
 * A web instance of our API client. We use an API proxy for our API client on
 * the web. To see the implementation of our API proxy look for the
 * file `APIProxy.js`.
 */
export const API = APIClient.create({
  url: "/api",
});
