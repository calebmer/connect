// NOTE: Let’s try our hardest to avoid environment variables. An environment
// variables are implicit, untyped, and unreliable. Many a-bug may be caused
// simply by accidentally misconfiguring an environment variable, and
// environment variables are _so easy_ to misconfigure by accident. Let’s try
// not to depend on the entire configuration of a machine when configuring
// our applications.
//
// Source: https://twitter.com/Nick_Craver/status/1102193050095374337

/**
 * Are we running in development mode?
 */
export const DEV = process.env.NODE_ENV === "development";

/**
 * Are we running in test mode?
 */
export const TEST = process.env.NODE_ENV === "test";

/**
 * The port that our application runs on.
 */
export const PORT = 4000;

/**
 * The secret we use to sign our JSON Web Tokens (JWT). In development and test
 * environments we use the super secret “`secret`” token. In production we need
 * a real secret from our environment variables.
 */
export const JWT_SECRET: string = (() => {
  if (DEV || TEST) {
    return "secret";
  } else if (process.env.JWT_SECRET) {
    return process.env.JWT_SECRET;
  } else {
    throw new Error("JWT secret is not configured.");
  }
})();
