import {AccountID, RefreshToken} from "@connect/api-client";
import {PGClient} from "../../PGClient";
import {RefreshTokenCollection} from "../Tokens";
import {sql} from "../../PGSQL";
import uuidV4 from "uuid/v4";

export class PGRefreshTokenCollection implements RefreshTokenCollection {
  constructor(private readonly client: PGClient) {}

  async generate(accountID: AccountID): Promise<RefreshToken> {
    const refreshToken = uuidV4() as RefreshToken;
    await this.client.query(
      sql`INSERT INTO refresh_token (token, account_id) VALUES (${refreshToken}, ${accountID})`,
    );
    return refreshToken;
  }

  /**
   * When we use a refresh token update the `last_used_at` column. By updating
   * `last_used_at` we can tell, roughly, the last hour or so the associated
   * account was active.
   */
  async use(token: RefreshToken): Promise<AccountID | undefined> {
    const {
      rows: [row],
    } = await this.client.query(
      sql`UPDATE refresh_token SET last_used_at = now() WHERE token = ${token} RETURNING account_id`,
    );
    if (row === undefined) {
      return undefined;
    } else {
      return row.account_id;
    }
  }

  async destroy(token: RefreshToken): Promise<void> {
    await this.client.query(
      sql`DELETE FROM refresh_token WHERE token = ${token}`,
    );
  }
}
