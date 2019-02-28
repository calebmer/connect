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
  const {
    rows: [newAccount],
  } = await database.query(
    "INSERT INTO account (email, password_hash) VALUES ($1, $2) " +
      "ON CONFLICT (email) DO NOTHING " +
      "RETURNING id",
    [email, passwordHash],
  );

  // If we did not create an account then we know the email was already in use
  // by some other account. Throw an API error for a nice error message.
  if (!newAccount) {
    throw new APIError(APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED);
  }

  // Otherwise, we have a new account!
  const accountID: number = newAccount.id;

  // We also want to sign our new account in, so generate new
  // authorization tokens...
  return await generateTokens(database, accountID);
}

/**
 * Allows a user to sign in to their account with the password they selected
 * when creating their account.
 */
export async function signIn(
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
  // Lookup the account associated with the provided email address.
  const {
    rows: [_account],
  } = await database.query(
    "SELECT id, password_hash FROM account WHERE email = $1",
    [email],
  );

  // Cast `account` to the correct type.
  const account: {id: number; password_hash: string} | undefined = _account;

  // If there is no account for the provided email address then throw an error.
  // We don’t let the person trying to sign in know whether they got the email
  // or password wrong as it could be a privacy vulnerability to expose who
  // has an account by guessing emails.
  if (!account) {
    throw new APIError(APIErrorCode.SIGN_IN_INCORRECT_EMAIL_PASSWORD);
  }

  // Use bcrypt to compare the new password against the hashed password in
  // our database.
  const same = await bcrypt.compare(password, account.password_hash);

  // If the passwords are not the same then throw an error. We must not sign
  // the person in if they gave us the wrong password.
  if (!same) {
    throw new APIError(APIErrorCode.SIGN_IN_INCORRECT_EMAIL_PASSWORD);
  }

  // Generate tokens for this account, officially signing the person in!
  return await generateTokens(database, account.id);
}

/**
 * Generate a refresh token and an access token for an account. These tokens
 * will be used to authorize an account when they try to access restricted
 * resources. Both `signUp()` and `signIn()` calls this function to generate
 * tokens after they have verify the identity of the person trying to sign in.
 */
async function generateTokens(database: Database, accountID: number) {
  // Randomly generate a new refresh token.
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
 * Allows a user to sign out of their account on their current device. To access
 * the private information associated with their account again the user must
 * sign back in.
 */
export async function signOut(
  _database: Database,
  _input: {
    readonly refreshToken: string;
  },
): Promise<{}> {
  throw new Error("TODO");
}
