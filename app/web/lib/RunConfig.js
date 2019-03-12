/**
 * Are we in development?
 */
const DEV = process.env.NODE_ENV === "development";

/**
 * The URL where our API lives.
 */
const API_URL = "http://localhost:4000";

module.exports = {
  DEV,
  API_URL,
};
