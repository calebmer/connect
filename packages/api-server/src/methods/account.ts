import {hash} from "bcrypt";
import {Database} from "../Database";

const saltRounds = 10;

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
  const passwordHash = await hash(password, saltRounds);

  // TODO: Email already exists error.
  const insertAccountResult = await database.query(
    "INSERT INTO account (email, password_hash) VALUES ($1, $2) " +
      "ON CONFLICT (email) DO NOTHING " +
      "RETURNING id",
    [email, passwordHash],
  );

  console.log(insertAccountResult);

  // await database.query("INSERT INTO refresh_token (account_id) VALUES ($1)", [
  //   accountID,
  // ]);

  return null as any;
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
