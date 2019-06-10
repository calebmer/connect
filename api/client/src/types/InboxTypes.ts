import {AccountID} from "./AccountTypes";
import {CommentID} from "./CommentTypes";
import {Cursor} from "../Range";
import {DateTime} from "./GroupTypes";

/** A unique type which is used as an identifier for inbox messages. */
export type InboxMessageID = string & {readonly _type: typeof InboxMessageID};
declare const InboxMessageID: unique symbol;

/**
 * A message in an account’s inbox.
 */
export type InboxMessage = CommentInboxMessage | NeverInboxMessage;

/** Common fields that all inbox messages have. */
export interface InboxMessageBase {
  /** The ID of our inbox message. */
  readonly id: InboxMessageID;
  /** The account who the inbox message was for. */
  readonly recipientID: AccountID;
  /** The time when the message was sent. */
  readonly sentAt: DateTime;
  /** Has the recipient dismissed the inbox message from their inbox? */
  readonly dismissed: boolean;
}

/**
 * A comment was left on a post that the current account follows.
 */
export interface CommentInboxMessage extends InboxMessageBase {
  readonly kind: "comment";
  readonly commentID: CommentID;
}

/**
 * This case only exists to force the developer to handle unexpected
 * inbox messages.
 */
export interface NeverInboxMessage extends InboxMessageBase {
  readonly kind: never;
}

/**
 * A cursor represents the position of a post in a list ordered by the inbox
 * message’s `sentAt` date.
 */
export type InboxMessageCursor = Cursor<[DateTime, InboxMessageID]>;

export const InboxMessageCursor = {
  /**
   * Get the cursor for an `InboxMessage`.
   */
  get(message: Pick<InboxMessage, "id" | "sentAt">): InboxMessageCursor {
    return Cursor.encode<[DateTime, InboxMessageID]>([
      message.sentAt,
      message.id,
    ]);
  },
};
