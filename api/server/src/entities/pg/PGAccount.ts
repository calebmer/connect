import {AccountAuth, AccountCollection} from "../Account";
import {AccountID, AccountProfile} from "@connect/api-client";
import {PGClient} from "../../PGClient";
import {sql} from "../../PGSQL";

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
      sql`
        INSERT INTO account (name, email, password_hash) VALUES
          (${name}, ${email}, ${passwordHash})
          ON CONFLICT (email) DO NOTHING
          RETURNING id
      `,
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
      sql`SELECT id, password_hash FROM account WHERE email = ${email}`,
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
      sql`SELECT name, avatar_url FROM account WHERE id = ${id}`,
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
