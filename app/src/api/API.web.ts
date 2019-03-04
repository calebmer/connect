import {APIClient} from "@connect/api-client";

/**
 * A web browser instance of our API client.
 */
export const API = APIClient.create({
  url: "/api",
  auth: null,
});
