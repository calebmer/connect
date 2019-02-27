import {APIInput, APIOutput} from "./ClientSchema";

/**
 * Creates a new account with an email and a password. Accounts may have any
 * string as their name even if another account has the same name. That name can
 * be updated at any time and is used for display purposes.
 */
export async function signUp(
  input: APIInput<"signUp">,
): Promise<APIOutput<"signUp">> {
  throw new Error("TODO");
}

/**
 * Allows a user to sign in to their account with the password they selected
 * when creating their account.
 */
export async function signIn(
  input: APIInput<"signIn">,
): Promise<APIOutput<"signIn">> {
  throw new Error("TODO");
}

/**
 * Allows a user to sign out of their account on their current device. To access
 * the private information associated with their account again the user must
 * sign back in.
 */
export async function signOut(
  input: APIInput<"signOut">,
): Promise<APIOutput<"signOut">> {
  throw new Error("TODO");
}
