// NOTE: Let’s try our hardest to avoid environment variables. An environment
// variables are implicit, untyped, and unreliable. Many a-bug may be caused
// simply by accidentally misconfiguring an environment variable, and
// environment variables are _so easy_ to misconfigure by accident. Let’s try
// not to depend on the entire configuration of a machine when configuring
// our applications.
//
// Source: https://twitter.com/Nick_Craver/status/1102193050095374337

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
  if (
    process.env.NODE_ENV === "development" ||
    process.env.NODE_ENV === "test"
  ) {
    return "secret";
  } else {
    throw new Error("JWT secret is not configured.");
  }
})();
