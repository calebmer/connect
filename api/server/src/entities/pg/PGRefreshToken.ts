import {RefreshToken, RefreshTokenCollection} from "../RefreshToken";
import {AccountID} from "../Account";
import {PGClient} from "../../PGClient";
import uuidV4 from "uuid/v4";

export class PGRefreshTokenCollection implements RefreshTokenCollection {
  constructor(private readonly client: PGClient) {}

  async create(accountID: AccountID): Promise<RefreshToken> {
    const refreshToken = uuidV4() as RefreshToken;
    await this.client.query(
      "INSERT INTO refresh_token (token, account_id) VALUES ($1, $2)",
      [refreshToken, accountID],
    );
    return refreshToken;
  }

  async use(refreshToken: RefreshToken): Promise<AccountID | undefined> {
    const {
      rows: [row],
    } = await this.client.query(
      "UPDATE refresh_token SET last_used_at = now() WHERE token = $1 RETURNING account_id",
      [refreshToken],
    );
    if (row === undefined) {
      return undefined;
    } else {
      return row.account_id;
    }
  }
}
