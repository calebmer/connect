import {AccountID, GroupID} from "@connect/api-client";
import {PGTable} from "../PGTable";
import {PGType} from "../PGType";

export const GroupMemberTable = PGTable.define({
  name: "group_member",
  columns: {
    account_id: PGType.int as PGType<AccountID>,
    group_id: PGType.int as PGType<GroupID>,
    joined_at: PGType.timestamp,
  },

  privacy(groupMember, query, accountID) {
    return query.where(groupMember.account_id.equals(accountID));
  },
});
