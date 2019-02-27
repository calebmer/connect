import {Database} from "../Database";
import {hash, compare} from "bcrypt";

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
    email: string;
    password: string;
  },
): Promise<{
  accessToken: string;
  refreshToken: string;
}> {
  const passwordHash = await hash(password, saltRounds);

  // TODO: Email already exists error.
  await database.query(
    "INSERT INTO account (email, password_hash) VALUES ($1, $2)",
    [email, passwordHash],
  );

  await database.query("INSERT INTO refresh_token (account_id) VALUES ($1)", [
    accountID,
  ]);

  throw new Error("TODO");
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
    email: string;
    password: string;
  },
): Promise<{
  accessToken: string;
  refreshToken: string;
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
    refreshToken: string;
  },
): Promise<void> {
  throw new Error("TODO");
}
