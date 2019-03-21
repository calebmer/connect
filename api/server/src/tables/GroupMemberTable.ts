import {AccountID, GroupID} from "@connect/api-client";
import {PGTable} from "../pg/PGTable";
import {PGType} from "../pg/PGType";

export const GroupMemberTable = PGTable.define({
  name: "group_member",
  columns: {
    account_id: PGType.int as PGType<AccountID>,
    group_id: PGType.int as PGType<GroupID>,
    joined_at: PGType.timestamp,
  },

  privacySelect(groupMember, ctx, query) {
    return query.where(groupMember.account_id.equals(ctx.accountID));
  },
});
