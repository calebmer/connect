import {
  APIError,
  APIErrorCode,
  AccessToken,
  AccountID,
  AccountProfile,
  RefreshToken,
} from "@connect/api-client";
import {AccessTokenGenerator, RefreshTokenCollection} from "../entities/Tokens";
import {AccountCollection} from "../entities/Account";
import {AccountProfileView} from "../tables/AccountTable";
import {PGClient} from "../PGClient";
import bcrypt from "bcrypt";

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
  ctx: {
    readonly accounts: AccountCollection;
    readonly refreshTokens: RefreshTokenCollection;
  },
  input: {
    readonly name: string;
    readonly email: string;
    readonly password: string;
  },
): Promise<{
  readonly accessToken: AccessToken;
  readonly refreshToken: RefreshToken;
}> {
  // Require a display name and an email. We will not accept an empty string!
  if (input.name.length < 2 || input.email === "") {
    throw new APIError(APIErrorCode.BAD_INPUT);
  }

  // Hash the provided password with bcrypt.
  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  // Attempt to create a new account. If there is already an account with the
  // same email then we’ll do nothing. Otherwise we’ll return the ID of the
  // new account.
  const newAccountID = await ctx.accounts.register({
    name: input.name,
    email: input.email,
    passwordHash,
  });

  // If we did not create an account then we know the email was already in use
  // by some other account. Throw an API error for a nice error message.
  if (newAccountID === undefined) {
    throw new APIError(APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED);
  }

  // We also want to sign our new account in, so generate new
  // authorization tokens...
  return await generateTokens(ctx, newAccountID);
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
  ctx: {
    readonly accounts: AccountCollection;
    readonly refreshTokens: RefreshTokenCollection;
  },
  input: {
    readonly email: string;
    readonly password: string;
  },
): Promise<{
  readonly accessToken: AccessToken;
  readonly refreshToken: RefreshToken;
}> {
  // Lookup the account associated with the provided email address.
  const account = await ctx.accounts.getAuth(input.email);

  // If there is no account for the provided email address then throw an error.
  //
  // It may help an attacker to know whether the email was incorrect or the
  // password. However, they could get this information anyway from our sign-up
  // method by checking whether an account with a given email exists.
  if (account === undefined) {
    throw new APIError(APIErrorCode.SIGN_IN_UNRECOGNIZED_EMAIL);
  }

  // Use bcrypt to compare the new password against the hashed password in
  // our database.
  const same = await bcrypt.compare(input.password, account.passwordHash);

  // If the passwords are not the same then throw an error. We must not sign
  // the person in if they gave us the wrong password.
  if (same === false) {
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
  ctx: {readonly refreshTokens: RefreshTokenCollection},
  input: {readonly refreshToken: RefreshToken},
): Promise<{}> {
  await ctx.refreshTokens.destroy(input.refreshToken);
  return {};
}

/**
 * Uses a refresh token to generate a new access token. This method can be
 * used when you have an expired access token and you need to get a new one.
 */
export async function refreshAccessToken(
  ctx: {readonly refreshTokens: RefreshTokenCollection},
  {refreshToken}: {readonly refreshToken: RefreshToken},
): Promise<{
  readonly accessToken: AccessToken;
}> {
  // Fetch the refresh token from our database. Since we are only given a
  // string, up-cast to a refresh token. It won’t hurt to trust this input.
  const accountID = await ctx.refreshTokens.use(refreshToken);

  // If the refresh token does not exist then we can’t create a new
  // access token.
  if (accountID === undefined) {
    throw new APIError(APIErrorCode.REFRESH_TOKEN_INVALID);
  }

  // Generate a new access token.
  const accessToken = await AccessTokenGenerator.generate({id: accountID});

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
async function generateTokens(
  ctx: {readonly refreshTokens: RefreshTokenCollection},
  accountID: AccountID,
): Promise<{
  readonly accessToken: AccessToken;
  readonly refreshToken: RefreshToken;
}> {
  // Generate a new refresh token. This way when the access token we create
  // expires the API client will be able to get a new one.
  const refreshToken = await ctx.refreshTokens.generate(accountID);

  // Create a new access token that lasts for one hour. When the access token
  // expires an API client may use the refresh token to get a new access token.
  const accessToken = await AccessTokenGenerator.generate({id: accountID});

  // Return our refresh token and access token.
  return {
    accessToken,
    refreshToken,
  };
}

/**
 * Gets basic information about the current account’s profile. Takes no
 * input because we use the authorization context to determine the
 * current profile.
 */
export async function getCurrentProfile(
  ctx: {readonly client: PGClient},
  accountID: AccountID,
): Promise<{
  readonly account: AccountProfile;
}> {
  // Select all the account profiles our client asked for.
  const [account] = await AccountProfileView.select({
    id: AccountProfileView.id,
    name: AccountProfileView.name,
    avatarURL: AccountProfileView.avatar_url,
  })
    .where(AccountProfileView.id.equals(accountID))
    .execute(ctx.client, accountID);

  // If the account does not exist then throw an error! We expect our
  // authorized account to exist.
  if (account === undefined) throw new APIError(APIErrorCode.NOT_FOUND);

  return {account};
}

/**
 * Gets basic public information about some account’s profile.
 */
export async function getProfile(
  ctx: {readonly client: PGClient},
  accountID: AccountID,
  input: {readonly id: AccountID},
): Promise<{
  readonly account: AccountProfile | null;
}> {
  // Select all the account profiles our client asked for.
  const [account] = await AccountProfileView.select({
    id: AccountProfileView.id,
    name: AccountProfileView.name,
    avatarURL: AccountProfileView.avatar_url,
  })
    .where(AccountProfileView.id.equals(input.id))
    .execute(ctx.client, accountID);

  return {account: account || null};
}

/**
 * Gets basic public information about some account’s profile.
 */
export async function getManyProfiles(
  ctx: {readonly client: PGClient},
  accountID: AccountID,
  input: {readonly ids: ReadonlyArray<AccountID>},
): Promise<{
  readonly accounts: ReadonlyArray<AccountProfile>;
}> {
  // Select all the account profiles our client asked for.
  const accounts = await AccountProfileView.select({
    id: AccountProfileView.id,
    name: AccountProfileView.name,
    avatarURL: AccountProfileView.avatar_url,
  })
    .where(AccountProfileView.id.any(input.ids))
    .execute(ctx.client, accountID);

  return {accounts};
}
