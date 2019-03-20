import {AccountID} from "@connect/api-client";
import {PGTable} from "../pg/PGTable";
import {PGType} from "../pg/PGType";

/**
 * The table containing all of an account’s information. Only the owner of this
 * account may access data from this table.
 */
export const AccountTable = PGTable.define({
  name: "account",
  columns: {
    id: PGType.int as PGType<AccountID>,
    name: PGType.text,
    avatar_url: PGType.text.nullable(),
    email: PGType.text,
    password_hash: PGType.text,
    created_at: PGType.timestamp,
  },

  privacy(account, query, accountID) {
    return query.where(account.id.equals(accountID));
  },
});

/**
 * A view of public account profile information. Has fewer fields then
 * `AccountTable`. For example, we don’t include the `password_hash` in an
 * account’s public profile.
 *
 * All account profiles are public! Group memberships and the content an account
 * posts in a group are both private information, though.
 */
export const AccountProfileView = PGTable.define({
  name: "account",
  columns: {
    id: PGType.int as PGType<AccountID>,
    name: PGType.text,
    avatar_url: PGType.text.nullable(),
  },

  privacy(_account, query) {
    return query;
  },
});
