import {AccountID, Post, PostID} from "@connect/api-client";

/**
 * Manages a collection of posts.
 */
export interface PostCollection {
  /**
   * Gets a post, but only if the account viewing the post is a member in the
   * group the post was posted in.
   */
  get(accountID: AccountID, postID: PostID): Promise<Post | undefined>;
}
