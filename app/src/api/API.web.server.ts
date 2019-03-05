import {APIClient} from "@connect/api-client";
import {API_URL} from "../RunConfig";

/**
 * A web server instance of our API client.
 */
export const API = APIClient.create({
  url: API_URL,
});
