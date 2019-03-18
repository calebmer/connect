import {AccountID} from "./Account";
import {Cursor} from "../Range";
import {DateTime} from "./Group";
import {PostID} from "./Post";

/** A unique type which is used as an identifier for comments. */
export type CommentID = number & {readonly _type: typeof CommentID};
declare const CommentID: unique symbol;

/**
 * A cursor represents the position of a comment in a list ordered by the
 * comment’s `postedAt` date.
 */
export type CommentCursor = Cursor<[DateTime, CommentID]>;

/**
 * The type of a comment which is a reply to some post.
 */
export type Comment = {
  readonly id: CommentID;
  /** The post this comment is replying to. */
  readonly postID: PostID;
  /** The account which authored this comment. */
  readonly authorID: AccountID;
  /** The content of the comment in some kind of markdown-ish format. */
  readonly content: string;
  /** The time at which the comment was posted. */
  readonly postedAt: DateTime;
};
