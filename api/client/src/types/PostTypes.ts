import {DateTime, GroupID} from "./GroupTypes";
import {AccountID} from "./AccountTypes";
import {Cursor} from "../Range";

/** A unique type which is used as an identifier for posts. */
export type PostID = number & {readonly _type: typeof PostID};
declare const PostID: unique symbol;

/**
 * An account may post some message in a group to start a conversation or share
 * their thoughts with the world. A post may, in turn, have any number
 * of comments.
 */
export type Post = {
  readonly id: PostID;
  /** The group this was posted in. */
  readonly groupID: GroupID;
  /** The author of this post. */
  readonly authorID: AccountID;
  /** The time at which this post was published. */
  readonly publishedAt: DateTime;
  /** The contents of this post in a Markdown-ish format. */
  readonly content: string;
};

/**
 * A cursor represents the position of a post in a list ordered by the post’s
 * `publishedAt` date.
 */
export type PostCursor = Cursor<[DateTime, PostID]>;

export const PostCursor = {
  /**
   * Get the cursor for a `Post`.
   */
  get(post: Pick<Post, "id" | "publishedAt">): PostCursor {
    return Cursor.encode<[DateTime, PostID]>([post.publishedAt, post.id]);
  },
};
