import {
  AccountID,
  Comment,
  CommentCursor,
  CommentID,
  DateTime,
  PostID,
  RangeDirection,
  generateID,
} from "@connect/api-client";
import {API} from "../api/API";
import {AccountCache} from "../account/AccountCache";
import {Cache} from "../cache/Cache";
import {Paginator} from "../cache/Paginator";

/**
 * Caches comments by their ID.
 */
export const CommentCache = new Cache<CommentID, CommentCacheEntry>({
  async load(id) {
    const {comment} = await API.comment.getComment({id});
    if (comment == null) throw new Error("Comment not found.");
    AccountCache.preload(comment.authorID); // Preload the comment’s author. We will probably need that.
    return {
      status: CommentCacheEntryStatus.Commit,
      comment,
    };
  },
});

/**
 * The status of a `CommentCacheEntry`. Uses common lingo from transaction status.
 */
enum CommentCacheEntryStatus {
  /** The cache entry is optimistic and has not yet been committed. */
  Pending,
  /** The cache entry is fully commit to the backend, hooray! */
  Commit,
  /** The cache entry failed to commit so we need to roll it back. */
  Rollback,
}

/**
 * An entry for a comment in our `CommentCache`. It contains the comment data
 * from the API and other status information about the comment.
 *
 * When we publish a comment we insert a cache entry with a status of
 * “pending”. When we finish publishing the comment we change the status to
 * “commit”. If we fail to publish the comment we change the status
 * to “rollback”.
 */
type CommentCacheEntry = {
  readonly status: CommentCacheEntryStatus;
  readonly comment: Comment;
};

/**
 * An entry for a `Comment` in a `CacheList`. Notice how this only has the
 * comment ID? To get the full post object use the ID to fetch the data from
 * `CommentCache`. We also include the time at which the post was published so
 * that we can create the `CommentCursor` from a cache entry.
 */
export type PostCommentsCacheEntry = {
  /** The ID of this comment. */
  readonly id: CommentID;
  /** The time this comment was published at. */
  readonly publishedAt: DateTime;

  /**
   * Was this comment added to our list as a part of a realtime event? Either
   * a subscription or the user entering a new post.
   */
  readonly realtime: boolean;
};

/** The number of comments we load for a post in our initial fetch. */
export const commentCountInitial = 16;

/**
 * A cache which holds a list of comments for each post. When loading a list
 * from this cache, we load the first few comments before returning the list.
 */
export const PostCommentsCache = new Cache<
  PostID,
  Paginator<CommentCursor, PostCommentsCacheEntry>
>({
  async load(postID) {
    return await Paginator.load<CommentCursor, PostCommentsCacheEntry>({
      direction: RangeDirection.First,
      count: commentCountInitial,
      cursor: CommentCursor.get,

      async load(range) {
        // Fetch the comments for this range from our API.
        const {comments} = await API.comment.getPostComments({
          postID,
          ...range,
        });

        // All the accounts we want to preload.
        const accountIDs = new Set<AccountID>();

        // Loop through all the comments and create cache entries for our
        // comment list. Also insert each post into our `CommentCache`.
        const entries = comments.map<PostCommentsCacheEntry>(comment => {
          CommentCache.insert(comment.id, {
            status: CommentCacheEntryStatus.Commit,
            comment,
          });
          accountIDs.add(comment.authorID);
          return {
            id: comment.id,
            publishedAt: comment.publishedAt,
            realtime: false,
          };
        });

        // Load comment authors since we’ll probably want those when
        // rendering a comment.
        await AccountCache.loadMany(accountIDs);

        return entries;
      },
    });
  },
});

/**
 * Publishes a new comment! Immediately generates a new comment ID and inserts a
 * pending comment object into the cache. We return the new comment ID
 * synchronously so that the caller can optimistically display the new comment.
 *
 * We then trigger an asynchronous API call to actually publish the comment in
 * the background. If the API fails then we will change the status of our cache
 * entry to reflect the failure.
 */
export function publishComment({
  authorID,
  postID,
  content,
}: {
  authorID: AccountID;
  postID: PostID;
  content: string;
}): CommentID {
  // Generate a new ID for our comment. The ID we generate should be globally
  // unique thanks to our algorithm.
  const commentID = generateID<CommentID>();

  // Create a pending comment object. This is what the final comment _should_
  // look like.
  const pendingComment: Comment = {
    id: commentID,
    postID,
    authorID,
    publishedAt: DateTime.now(), // The server will assign a definitive timestamp.
    content: content.trim(),
  };

  // Insert our pending comment into the cache! This way it will
  // render immediately.
  CommentCache.insert(commentID, {
    status: CommentCacheEntryStatus.Pending,
    comment: pendingComment,
  });

  // Insert our post as a phantom item in our group post list immediately so
  // that it’s shown in the UI.
  PostCommentsCache.update(postID, comments => {
    return comments.insert({
      id: commentID,
      publishedAt: pendingComment.publishedAt,
      realtime: true,
    });
  });

  // TODO: Error handling!
  (async () => {
    try {
      // Actually publish the comment using our API! The API will give us the
      // server assigned publish date.
      const {publishedAt} = await API.comment.publishComment({
        id: commentID,
        postID,
        content,
      });

      // Insert the final comment object into the cache and flip the status
      // to “commit”.
      CommentCache.insert(commentID, {
        status: CommentCacheEntryStatus.Commit,
        comment: {...pendingComment, publishedAt},
      });
    } catch (error) {
      // If we failed to insert the comment then make sure to reflect that in
      // our UI.
      CommentCache.insert(commentID, {
        status: CommentCacheEntryStatus.Rollback,
        comment: pendingComment,
      });

      throw error;
    }
  })();

  return commentID;
}
