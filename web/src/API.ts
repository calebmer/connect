import {APIClient} from "@connect/api-client";

/**
 * A web instance of our API client.
 */
export const API = APIClient.create({
  url: "/api",
  auth: null,
});
