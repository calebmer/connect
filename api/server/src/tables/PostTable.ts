import {AccountID, GroupID, PostID} from "@connect/api-client";
import {GroupMemberTable} from "./GroupMemberTable";
import {PGTable} from "../pg/PGTable";
import {PGType} from "../pg/PGType";

export const PostTable = PGTable.define({
  name: "post",
  columns: {
    id: PGType.int as PGType<PostID>,
    group_id: PGType.int as PGType<GroupID>,
    author_id: PGType.int as PGType<AccountID>,
    content: PGType.text,
    published_at: PGType.timestamp,
  },

  privacy(post, query, accountID) {
    return (
      query
        // Ok to ignore privacy since we only select group member rows with the
        // same ID as our authenticated account.
        .ignorePrivacy_leftJoin(
          GroupMemberTable,
          GroupMemberTable.group_id.equals(post.group_id),
        )

        .where(GroupMemberTable.account_id.equals(accountID))
    );
  },
});
