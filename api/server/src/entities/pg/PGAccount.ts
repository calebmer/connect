import {
  AccountAuth,
  AccountCollection,
  AccountID,
  AccountProfile,
} from "../Account";
import {PGClient} from "../../PGClient";

export class PGAccountCollection implements AccountCollection {
  constructor(private readonly client: PGClient) {}

  async register({
    name,
    email,
    passwordHash,
  }: {
    readonly name: string;
    readonly email: string;
    readonly passwordHash: string;
  }): Promise<AccountID | undefined> {
    const {
      rows: [row],
    } = await this.client.query(
      "INSERT INTO account (name, email, password_hash) VALUES ($1, $2, $3) " +
        "ON CONFLICT (email) DO NOTHING " +
        "RETURNING id",
      [name, email, passwordHash],
    );
    if (row === undefined) {
      return undefined;
    } else {
      return row.id;
    }
  }

  async getAuth(email: string): Promise<AccountAuth | undefined> {
    const {
      rows: [row],
    } = await this.client.query(
      "SELECT id, password_hash FROM account WHERE email = $1",
      [email],
    );
    if (row === undefined) {
      return undefined;
    } else {
      return {
        id: row.id,
        email,
        passwordHash: row.password_hash,
      };
    }
  }

  async getProfile(id: AccountID): Promise<AccountProfile | undefined> {
    const {
      rows: [row],
    } = await this.client.query(
      "SELECT name, avatar_url FROM account WHERE id = $1",
      [id],
    );
    if (row === undefined) {
      return undefined;
    } else {
      return {
        id,
        name: row.name,
        avatarURL: row.avatar_url,
      };
    }
  }
}
