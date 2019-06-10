import {
  AccountID,
  Comment,
  CommentID,
  DateTime,
  GroupID,
  Range,
} from "@connect/api-client";
import {
  InboxMessage,
  InboxMessageCursor,
  InboxMessageID,
} from "@connect/api-client/src/types/InboxTypes";
import {Context} from "../Context";
import {PGPagination} from "../pg/PGPagination";
import {sql} from "../pg/SQL";

/**
 * The type of a row in the Postgres `inbox` table. We have a custom type for
 * an `inbox` row because the table is structured as a tagged union. Our type
 * represents the different possible variants.
 */
type InboxMessageRow = {
  id: InboxMessageID;
  recipient_id: AccountID;
  sent_at: DateTime;
  dismissed: boolean;
} & (
  | {
      kind: "comment";
      comment_id: CommentID;
    }
  | {
      // NOTE: Remove this when we actually have a second case. Right now it
      // only serves to trigger TypeScript’s tagged union matching with
      // a `switch`.
      kind: "nope";
    });

// Create a paginator for inbox messages.
const PGPaginationInbox = new PGPagination(sql`inbox`, [
  {column: sql`sent_at`, descending: true},
  {column: sql`id`, descending: true},
]);

/**
 * Gets a range of messages from the current account’s inbox along with any of
 * the associated data.
 *
 * We include associated data if there is an 80% or greater chance that the
 * client hasn’t already cached this data.
 */
export async function getInbox(
  ctx: Context,
  input: {readonly groupID: GroupID} & Range<InboxMessageCursor>,
): Promise<{
  readonly messages: ReadonlyArray<InboxMessage>;
  readonly comments: ReadonlyArray<Comment>;
}> {
  // Get a list of inbox messages in reverse chronological order using the
  // pagination parameters provided by our input.
  const rows: Array<InboxMessageRow> = await PGPaginationInbox.query(ctx, {
    selection: sql`id, sent_at, kind, comment_id`,
    extraCondition: sql`recipient_id = ${ctx.accountID} AND dismissed = FALSE`,
    range: input,
  }).then(({rows}) => rows);

  // Collect IDs for other resources we want to fetch...
  const commentIDs: Array<CommentID> = [];

  // Transform all of our inbox message rows into their proper type.
  const messages = rows.map(row => {
    let message: InboxMessage;
    switch (row.kind) {
      case "comment": {
        message = {
          id: row.id,
          recipientID: ctx.accountID,
          sentAt: row.sent_at,
          dismissed: false,
          kind: "comment",
          commentID: row.comment_id,
        };
        commentIDs.push(row.comment_id);
        break;
      }
      default: {
        const never: {kind: "nope"} = row;
        throw new Error(`Unrecognized inbox message kind: ${never["kind"]}`);
      }
    }
    return message;
  });

  return {
    messages,
    comments: [], // TODO
  };
}
