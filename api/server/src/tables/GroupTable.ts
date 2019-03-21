import {AccountID, GroupID} from "@connect/api-client";
import {GroupMemberTable} from "./GroupMemberTable";
import {PGTable} from "../pg/PGTable";
import {PGType} from "../pg/PGType";

export const GroupTable = PGTable.define({
  name: "group",
  columns: {
    id: PGType.int as PGType<GroupID>,
    slug: PGType.text,
    name: PGType.text,
    owner_id: PGType.int as PGType<AccountID>,
    created_at: PGType.timestamp,
  },

  privacySelect(group, ctx, query) {
    return (
      query
        // Ok to ignore privacy since we only select group member rows with the
        // same ID as our authenticated account.
        .ignorePrivacy_leftJoin(
          GroupMemberTable,
          GroupMemberTable.group_id.equals(group.id),
        )

        .where(GroupMemberTable.account_id.equals(ctx.accountID))
    );
  },
});
