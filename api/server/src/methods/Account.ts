import {APIError, APIErrorCode} from "@connect/api-client";
import {Context, ContextUnauthorized} from "../Context";
import {JWT_SECRET} from "../RunConfig";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import uuidV4 from "uuid/v4";

/**
 * Balances speed and security for the bcrypt algorithm. See the
 * [bcrypt module’s][1] documentation for more.
 *
 * [1]: https://yarn.pm/bcrypt
 */
const SALT_ROUNDS = 10;

/**
 * Creates a new account with an email and a password. Accounts may have any
 * string as their name even if another account has the same name. That name can
 * be updated at any time and is used for display purposes.
 *
 * NOTE: We allow an account to be created with a password of any length.
 * However, in the UI we require accounts to have a password of at least 8
 * characters for security. This way if the clever hacker really wants a
 * password with less than 8 characters they can find a way around our UI.
 *
 * TODO: We need some kind of client secret to ensure clients who aren’t
 * verified don’t access our API. Right now, anyone can make a request against
 * our API!
 */
export async function signUp(
  ctx: ContextUnauthorized,
  {
    displayName,
    email,
    password,
  }: {
    readonly displayName: string;
    readonly email: string;
    readonly password: string;
  },
): Promise<{
  readonly accessToken: string;
  readonly refreshToken: string;
}> {
  // Require a display name and an email. We will not accept an empty string!
  if (displayName.length < 2 || email === "") {
    throw new APIError(APIErrorCode.BAD_INPUT);
  }

  // Hash the provided password with bcrypt.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Attempt to create a new account. If there is already an account with the
  // same email then we’ll do nothing. Otherwise we’ll return the ID of the
  // new account.
  const {
    rows: [newAccount],
  } = await ctx.database.query(
    "INSERT INTO account (display_name, email, password_hash) VALUES ($1, $2, $3) " +
      "ON CONFLICT (email) DO NOTHING " +
      "RETURNING id",
    [displayName, email, passwordHash],
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
  return await generateTokens(ctx, accountID);
}

/**
 * Allows a user to sign in to their account with the password they selected
 * when creating their account.
 *
 * TODO: We need some kind of client secret to ensure clients who aren’t
 * verified don’t access our API. Right now, anyone can make a request against
 * our API!
 */
export async function signIn(
  ctx: ContextUnauthorized,
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
  } = await ctx.database.query(
    "SELECT id, password_hash FROM account WHERE email = $1",
    [email],
  );

  // Cast `account` to the correct type.
  const account: {id: number; password_hash: string} | undefined = _account;

  // If there is no account for the provided email address then throw an error.
  //
  // It may help an attacker to know whether the email was incorrect or the
  // password. However, they could get this information anyway from our sign-up
  // method by checking whether an account with a given email exists.
  if (!account) {
    throw new APIError(APIErrorCode.SIGN_IN_UNRECOGNIZED_EMAIL);
  }

  // Use bcrypt to compare the new password against the hashed password in
  // our database.
  const same = await bcrypt.compare(password, account.password_hash);

  // If the passwords are not the same then throw an error. We must not sign
  // the person in if they gave us the wrong password.
  if (!same) {
    throw new APIError(APIErrorCode.SIGN_IN_INCORRECT_PASSWORD);
  }

  // Generate tokens for this account, officially signing the person in!
  return await generateTokens(ctx, account.id);
}

/**
 * Allows a user to sign out of their account on their current device. To access
 * the private information associated with their account again the user must
 * sign back in.
 */
export async function signOut(
  _ctx: ContextUnauthorized,
  _input: {
    readonly refreshToken: string;
  },
): Promise<{}> {
  throw new Error("TODO");
}

/**
 * Uses a refresh token to generate a new access token. This method can be
 * used when you have an expired access token and you need to get a new one.
 */
export async function refreshAccessToken(
  ctx: ContextUnauthorized,
  {
    refreshToken,
  }: {
    readonly refreshToken: string;
  },
): Promise<{
  readonly accessToken: string;
}> {
  // Fetch the refresh token from our database and update the `last_used_at`
  // column. By updating `last_used_at` we can tell, roughly, the last hour or
  // so the associated account was active.
  const {
    rows: [_token],
  } = await ctx.database.query(
    "UPDATE refresh_token SET last_used_at = now() WHERE token = $1 RETURNING account_id",
    [refreshToken],
  );

  // Cast our database response to the appropriate type.
  const token: {readonly account_id: number} | undefined = _token;

  // If the refresh token does not exist then we can’t create a new
  // access token.
  if (!token) {
    throw new APIError(APIErrorCode.REFRESH_TOKEN_INVALID);
  }

  // Generate a new access token.
  const accessToken = await generateAccessToken(token.account_id);

  return {
    accessToken,
  };
}

/**
 * Generate a refresh token and an access token for an account. These tokens
 * will be used to authorize an account when they try to access restricted
 * resources. Both `signUp()` and `signIn()` calls this function to generate
 * tokens after they have verify the identity of the person trying to sign in.
 */
async function generateTokens(ctx: ContextUnauthorized, accountID: number) {
  // Randomly generate a new refresh token.
  const refreshToken = uuidV4();

  // Add our new refresh token to the database. This way when the access token
  // we create expires the API client will be able to get a new one.
  await ctx.database.query(
    "INSERT INTO refresh_token (token, account_id) VALUES ($1, $2)",
    [refreshToken, accountID],
  );

  // Create a new access token that lasts for one hour. When the access token
  // expires an API client may use the refresh token to get a new access token.
  const accessToken = await generateAccessToken(accountID);

  // Return our refresh token and access token.
  return {
    refreshToken,
    accessToken,
  };
}

/**
 * Generate a new access token for an account. The access token has a relatively
 * short expiration time. If an attacker gets their hands on an access token
 * that means they have access to the associated account until the
 * expiration time.
 */
async function generateAccessToken(accountID: number) {
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

  return accessToken;
}

/**
 * Gets basic information about the current account’s profile. Takes no
 * input because we use the authorization context to determine the
 * current profile.
 */
export function getCurrentProfile(
  _ctx: Context,
  {}: {},
): Promise<{
  readonly displayName: string;
}> {
  throw new Error("TODO");
}
