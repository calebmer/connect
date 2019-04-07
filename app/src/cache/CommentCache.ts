import {
  AccountID,
  Comment,
  CommentCursor,
  CommentID,
  DateTime,
  PostID,
} from "@connect/api-client";
import {API} from "../api/API";
import {AccountCache} from "./AccountCache";
import {Cache} from "./framework/Cache";
import {CacheList} from "./framework/CacheList";

/**
 * Caches comments by their ID.
 */
export const CommentCache = new Cache<CommentID, Comment>({
  async load(id) {
    const {comment} = await API.comment.getComment({id});
    if (comment == null) throw new Error("Comment not found.");
    AccountCache.preload(comment.authorID); // Preload the comment’s author. We will probably need that.
    return comment;
  },
});

/**
 * An entry for a `Comment` in a `CacheList`. Notice how this only has the
 * comment ID? To get the full post object use the ID to fetch the data from
 * `CommentCache`. We also include the time at which the post was published so
 * that we can create the `CommentCursor` from a cache entry.
 */
export type CommentCacheListEntry = {
  readonly id: CommentID;
  readonly postedAt: DateTime;
};

/** The number of comments we load for a post in our initial fetch. */
export const commentCountInitial = 16;

/** The number of comments we load for a post as we are scrolling. */
export const commentCountMore = 8;

/**
 * A cache which holds a list of comments for each post. When loading a list
 * from this cache, we load the first few comments before returning the list.
 */
export const CommentCacheList = new Cache<
  PostID,
  CacheList<CommentCursor, CommentCacheListEntry>
>({
  async load(postID) {
    // Create the comment cache list...
    const commentCacheList = new CacheList<
      CommentCursor,
      CommentCacheListEntry
    >({
      cursor: CommentCursor.get,

      async load(range) {
        // Fetch the comments for this range from our API.
        const {comments} = await API.post.getPostComments({postID, ...range});

        // All the accounts we want to preload.
        const accountIDs: Array<AccountID> = [];

        // Loop through all the comments and create cache entries for our
        // comment list. Also insert each post into our `CommentCache`.
        const entries = comments.map<CommentCacheListEntry>(comment => {
          CommentCache.insert(comment.id, comment);
          accountIDs.push(comment.authorID);
          return {
            id: comment.id,
            postedAt: comment.postedAt,
          };
        });

        // Load comment authors since we’ll probably want those when
        // rendering a comment.
        await AccountCache.loadMany(accountIDs);

        return entries;
      },
    });

    // Load the first few comments into our cache. We will suspend until we’ve
    // loaded the first few posts.
    await commentCacheList.loadFirst(commentCountInitial);

    return commentCacheList;
  },
});
