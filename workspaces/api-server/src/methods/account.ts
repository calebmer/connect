import * as bcrypt from "bcrypt";
import * as uuidV4 from "uuid/v4";
import * as jwt from "jsonwebtoken";
import {APIError, APIErrorCode} from "@connect/api-client";
import {Database} from "../Database";

/**
 * Balances speed and security for the bcrypt algorithm. See the
 * [bcrypt module’s][1] documentation for more.
 *
 * [1]: https://yarn.pm/bcrypt
 */
const SALT_ROUNDS = 10;

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

/**
 * Creates a new account with an email and a password. Accounts may have any
 * string as their name even if another account has the same name. That name can
 * be updated at any time and is used for display purposes.
 */
export async function signUp(
  database: Database,
  {
    email,
    password,
  }: {
    readonly email: string;
    readonly password: string;
  },
): Promise<{
  readonly accessToken: string;
  readonly refreshToken: string;
}> {
  // Hash the provided password with bcrypt.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Attempt to create a new account. If there is already an account with the
  // same email then we’ll do nothing. Otherwise we’ll return the ID of the
  // new account.
  const insertAccountResult = await database.query(
    "INSERT INTO account (email, password_hash) VALUES ($1, $2) " +
      "ON CONFLICT (email) DO NOTHING " +
      "RETURNING id",
    [email, passwordHash],
  );

  // If we did not create an account then we know the email was already in use
  // by some other account. Throw an API error for a nice error message.
  if (insertAccountResult.rows.length === 0) {
    throw new APIError(APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED);
  }

  // Otherwise, we have a new account!
  const accountID: number = insertAccountResult.rows[0].id;

  // We also want to sign our new account in, so create a new refresh token...
  const refreshToken = uuidV4();

  // Add our new refresh token to the database. This way when the access token
  // we create expires the API client will be able to get a new one.
  await database.query(
    "INSERT INTO refresh_token (token, account_id) VALUES ($1, $2)",
    [refreshToken, accountID],
  );

  // Create a new access token that lasts for one hour. When the access token
  // expires an API client may use the refresh token to get a new access token.
  const accessToken = await new Promise<string>((resolve, reject) => {
    jwt.sign(
      {id: accountID},
      JWT_SECRET,
      {expiresIn: "1h"},
      (error, accessToken) => {
        if (error) reject(error);
        else resolve(accessToken);
      },
    );
  });

  // Return our refresh token and access token.
  return {
    refreshToken,
    accessToken,
  };
}

/**
 * Allows a user to sign in to their account with the password they selected
 * when creating their account.
 */
export async function signIn(
  database: Database,
  input: {
    readonly email: string;
    readonly password: string;
  },
): Promise<{
  readonly accessToken: string;
  readonly refreshToken: string;
}> {
  throw new Error("TODO");
}

/**
 * Allows a user to sign out of their account on their current device. To access
 * the private information associated with their account again the user must
 * sign back in.
 */
export async function signOut(
  database: Database,
  input: {
    readonly refreshToken: string;
  },
): Promise<{}> {
  throw new Error("TODO");
}
