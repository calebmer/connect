import {
  APIError,
  APIErrorCode,
  AccessToken,
  AccountID,
  AccountProfile,
  Group,
  RefreshToken,
  generateID,
} from "@connect/api-client";
import {Context, ContextUnauthorized} from "../Context";
import {AccessTokenGenerator} from "../AccessToken";
import bcrypt from "bcrypt";
import {sql} from "../pg/SQL";
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
    name,
    email,
    password,
  }: {
    readonly name: string;
    readonly email: string;
    readonly password: string;
  },
): Promise<{
  readonly accountID: AccountID;
  readonly accessToken: AccessToken;
  readonly refreshToken: RefreshToken;
}> {
  // Require a display name and an email. We will not accept an empty string!
  if (name.length < 2 || email === "") {
    throw new APIError(APIErrorCode.BAD_INPUT);
  }

  // Use the `connect_api_auth` role in this transaction. This will give us full
  // access to the `account` and `refresh_token` tables but nothing else.
  await ctx.query(sql`SET LOCAL ROLE connect_api_auth`);

  // Hash the provided password with bcrypt.
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // Generate a new ID for the account.
  const newAccountID = generateID<AccountID>();

  // Attempt to create a new account. If there is already an account with the
  // same email then throw an error saying so.
  try {
    await ctx.query(sql`
      INSERT INTO account (id, name, email, password_hash)
          VALUES (${newAccountID}, ${name}, ${email}, ${passwordHash})
    `);
  } catch (error) {
    if (
      error instanceof APIError &&
      error.code === APIErrorCode.ALREADY_EXISTS
    ) {
      throw new APIError(APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED);
    } else {
      throw error;
    }
  }

  // We also want to sign our new account in, so generate new
  // authorization tokens...
  const {accessToken, refreshToken} = await generateTokens(ctx, newAccountID);

  return {
    accountID: newAccountID,
    accessToken,
    refreshToken,
  };
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
  input: {
    readonly email: string;
    readonly password: string;
  },
): Promise<{
  readonly accountID: AccountID;
  readonly accessToken: AccessToken;
  readonly refreshToken: RefreshToken;
}> {
  // Use the `connect_api_auth` role in this transaction. This will give us full
  // access to the `account` and `refresh_token` tables but nothing else.
  await ctx.query(sql`SET LOCAL ROLE connect_api_auth`);

  // Lookup the account associated with the provided email address.
  const {
    rows: [account],
  } = await ctx.query(
    sql`SELECT id, password_hash FROM account WHERE email = ${input.email}`,
  );

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
  const same = await bcrypt.compare(input.password, account.password_hash);

  // If the passwords are not the same then throw an error. We must not sign
  // the person in if they gave us the wrong password.
  if (same === false) {
    throw new APIError(APIErrorCode.SIGN_IN_INCORRECT_PASSWORD);
  }

  // Generate tokens for this account, officially signing the person in!
  const {accessToken, refreshToken} = await generateTokens(ctx, account.id);

  return {
    accountID: account.id,
    accessToken,
    refreshToken,
  };
}

/**
 * Allows a user to sign out of their account on their current device. To access
 * the private information associated with their account again the user must
 * sign back in.
 */
export async function signOut(
  ctx: ContextUnauthorized,
  input: {readonly refreshToken: RefreshToken},
): Promise<{}> {
  // Use the `connect_api_auth` role in this transaction. This will give us full
  // access to the `account` and `refresh_token` tables but nothing else.
  await ctx.query(sql`SET LOCAL ROLE connect_api_auth`);

  // Delete the refresh token from our database!
  await ctx.query(
    sql`DELETE FROM refresh_token WHERE token = ${input.refreshToken}`,
  );

  return {};
}

/**
 * Uses a refresh token to generate a new access token. This method can be
 * used when you have an expired access token and you need to get a new one.
 */
export async function refreshAccessToken(
  ctx: ContextUnauthorized,
  {refreshToken}: {readonly refreshToken: RefreshToken},
): Promise<{
  readonly accessToken: AccessToken;
}> {
  // Use the `connect_api_auth` role in this transaction. This will give us full
  // access to the `account` and `refresh_token` tables but nothing else.
  await ctx.query(sql`SET LOCAL ROLE connect_api_auth`);

  // Fetch the refresh token from our database.
  //
  // When we use a refresh token we also update the `last_used_at` column. By
  // updating `last_used_at` we can tell, roughly, the last hour or so the
  // associated account was active.
  const {
    rows: [row],
  } = await ctx.query(sql`
       UPDATE refresh_token
          SET last_used_at = now()
        WHERE token = ${refreshToken}
    RETURNING account_id
  `);

  // Extract the account ID from the query.
  const accountID: AccountID | undefined = row ? row.account_id : undefined;

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
  ctx: ContextUnauthorized,
  accountID: AccountID,
): Promise<{
  readonly accessToken: AccessToken;
  readonly refreshToken: RefreshToken;
}> {
  // Generate a new refresh token. This way when the access token we create
  // expires the API client will be able to get a new one.
  const refreshToken = uuidV4() as RefreshToken;

  // Insert our refresh token into the database.
  await ctx.query(sql`
    INSERT INTO refresh_token (token, account_id)
         VALUES (${refreshToken}, ${accountID})
  `);

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
  ctx: Context,
): Promise<{readonly account: AccountProfile | null}> {
  // Select the profile of our current account.
  const {
    rows: [row],
  } = await ctx.query(sql`
    SELECT name, avatar_url
      FROM account_profile
     WHERE id = ${ctx.accountID}
  `);

  // If the account does not exist then throw an error! We expect our
  // authorized account to exist.
  if (row === undefined) {
    return {account: null};
  }

  // Correctly format the selected row.
  const account: AccountProfile = {
    id: ctx.accountID,
    name: row.name,
    avatarURL: row.avatar_url,
  };

  return {account};
}

/**
 * Gets all the groups that our current account is a member of. If the account
 * does not exist or is not the member of any groups then we return an
 * empty array.
 */
export async function getCurrentGroupsMemberships(
  ctx: Context,
): Promise<{readonly groups: ReadonlyArray<Group>}> {
  const {rows} = await ctx.query(sql`
       SELECT g.id, g.slug, g.name
         FROM "group" AS g
    LEFT JOIN group_member AS m ON m.group_id = g.id
        WHERE m.account_id = ${ctx.accountID}
  `);

  const groups = rows.map(row => {
    const group: Group = {
      id: row.id,
      slug: row.slug,
      name: row.name,
    };
    return group;
  });

  return {groups};
}

/**
 * Gets basic public information about some account’s profile.
 */
export async function getProfile(
  ctx: Context,
  input: {readonly id: AccountID},
): Promise<{
  readonly account: AccountProfile | null;
}> {
  // Select the profile of the requested account.
  const {
    rows: [row],
  } = await ctx.query(
    sql`SELECT name, avatar_url FROM account_profile WHERE id = ${input.id}`,
  );

  // Correctly format the selected row.
  if (row === undefined) {
    return {account: null};
  } else {
    const account: AccountProfile = {
      id: input.id,
      name: row.name,
      avatarURL: row.avatar_url,
    };
    return {account};
  }
}

/**
 * Gets basic public information about some account’s profile.
 */
export async function getManyProfiles(
  ctx: Context,
  input: {readonly ids: ReadonlyArray<AccountID>},
): Promise<{
  readonly accounts: ReadonlyArray<AccountProfile>;
}> {
  // Select the profiles of the requested accounts.
  const {rows} = await ctx.query(
    sql`SELECT id, name, avatar_url FROM account_profile WHERE id = ANY (${
      input.ids
    })`,
  );

  // Correctly format the selected rows.
  const accounts: ReadonlyArray<AccountProfile> = rows.map(row => ({
    id: row.id,
    name: row.name,
    avatarURL: row.avatar_url,
  }));

  return {accounts};
}
