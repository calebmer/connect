import {AccountID} from "./AccountTypes";
import {Cursor} from "../Range";
import {DateTime} from "./GroupTypes";
import {PostID} from "./PostTypes";

/** A unique type which is used as an identifier for comments. */
export type CommentID = string & {readonly _type: typeof CommentID};
declare const CommentID: unique symbol;

/**
 * The type of a comment which is a reply to some post.
 */
export type Comment = {
  readonly id: CommentID;
  /** The post this comment is replying to. */
  readonly postID: PostID;
  /** The account which authored this comment. */
  readonly authorID: AccountID;
  /** The time at which the comment was published. */
  readonly publishedAt: DateTime;
  /** The content of the comment in some kind of markdown-ish format. */
  readonly content: string;
};

/**
 * A cursor represents the position of a comment in a list ordered by the
 * comment’s `publishedAt` date.
 */
export type CommentCursor = Cursor<[DateTime, CommentID]>;

export const CommentCursor = {
  /**
   * Get the cursor for a `Comment`.
   */
  get(comment: Pick<Comment, "id" | "publishedAt">): CommentCursor {
    return Cursor.encode<[DateTime, CommentID]>([
      comment.publishedAt,
      comment.id,
    ]);
  },
};
