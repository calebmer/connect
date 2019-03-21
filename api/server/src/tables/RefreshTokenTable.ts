import {AccountID} from "@connect/api-client";
import {PGTable} from "../pg/PGTable";
import {PGType} from "../pg/PGType";

export const RefreshTokenTable = PGTable.define({
  name: "refresh_token",
  columns: {
    token: PGType.uuid,
    account_id: PGType.int as PGType<AccountID>,
    last_used_at: PGType.timestamp,
    created_at: PGType.timestamp,
  },

  // While the refresh token has no privacy policy, we should make sure that
  // only trusted API clients read from this table! Since there is private data
  // which could be exposed.
  privacySelect: null,
});
