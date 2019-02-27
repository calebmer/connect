import {DB} from "../Database";
import {ID} from "./ID";

/**
 * The main entity associated with signing in, signing out, and
 * application sessions.
 *
 * We try to avoid using the word “user” since it’s not very personal. We serve
 * people, not users.
 *
 * Accounts don’t map 1:1 with people. One person could have multiple accounts
 * or a business could also have an account. So we call our main authentication
 * table the account table.
 */
export class Account {
  /**
   * Fetches an account from our database by its email.
   */
  static async readByEmail(db: DB, email: string): Promise<Account | null> {
    const result = await db.query(
      "SELECT id, password_hash FROM account WHERE email = $1",
      [email],
    );
    const row = result.rows[0];
    if (row == null) {
      return null;
    } else {
      return new Account(row.id, email, row.password_hash);
    }
  }

  constructor(
    private id: ID<Account>,
    private email: string,
    private passwordHash: string,
  ) {}

  /**
   * Get the ID associated with this account.
   */
  getID(): ID<Account> {
    return this.id;
  }

  /**
   * Get the email associated with this account.
   */
  getEmail(): string {
    return this.email;
  }

  /**
   * Get the bcrypt password hash for this account.
   */
  getPasswordHash(): string {
    return this.passwordHash;
  }
}
