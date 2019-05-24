import {
  AccountID,
  Comment,
  CommentID,
  DateTime,
  PostID,
  generateID,
} from "@connect/api-client";
import {API} from "../api/API";
import {AccountCache} from "../account/AccountCache";
import {AppError} from "../api/AppError";
import {Cache} from "../cache/Cache";
import {Repair} from "../cache/Repair";
import {Skimmer} from "../cache/Skimmer";

/**
 * Caches comments by their ID.
 */
export const CommentCache = new Cache<CommentID, CommentCacheEntry>({
  async load(id) {
    const {comment} = await API.comment.getComment({id});
    if (comment == null) {
      throw new AppError("Can not find this comment.");
    }
    AccountCache.preload(comment.authorID); // Preload the comment’s author. We will probably need that.
    return {
      status: CommentCacheEntryStatus.Commit,
      comment,
    };
  },
});

// Register the cache for repairing when requested by the user...
Repair.registerCache(CommentCache);

/**
 * The status of a `CommentCacheEntry`. Uses common lingo from transaction status.
 */
export enum CommentCacheEntryStatus {
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
  /** Was this comment added to the cache as a part of a realtime event? */
  readonly realtime: boolean;
};

/** The number of comments we load for a post in our initial fetch. */
export const commentCountInitial = 16;

/** The number of comments we load when fetching more. */
export const commentCountMore = 16;

/**
 * A cache which holds a list of comments for each post. When loading a list
 * from this cache, we load the first few comments before returning the list.
 */
export const PostCommentsCache = new Cache<
  PostID,
  Skimmer<PostCommentsCacheEntry>
>({
  async load(postID) {
    const comments = Skimmer.create<PostCommentsCacheEntry>({
      async load({limit, offset}) {
        // Fetch the comments for this range from our API.
        const {comments} = await API.comment.getPostComments({
          postID,
          limit,
          offset,
        });

        // All the accounts we want to preload.
        const accountIDs = new Set<AccountID>();

        // Loop through all the comments and create cache entries for our
        // comment list. Also insert each post into our `CommentCache`.
        const entries = comments.map(comment => {
          CommentCache.insert(comment.id, {
            status: CommentCacheEntryStatus.Commit,
            comment,
          });
          accountIDs.add(comment.authorID);
          const entry: PostCommentsCacheEntry = {
            id: comment.id,
            realtime: false,
          };
          return entry;
        });

        // Load comment authors since we’ll probably want those when
        // rendering a comment.
        await AccountCache.loadMany(accountIDs);

        return entries;
      },
    });

    return await comments.load({limit: commentCountInitial, offset: 0});
  },
});

// Register the cache for repairing when requested by the user...
Repair.registerCache(PostCommentsCache);

/**
 * A set of comments that were published locally. We use this set to ignore
 * messages from our subscription if we know a comment was published locally.
 */
const locallyPublishedComments = new Set<CommentID>();

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

  // Insert our comment as a phantom item in our post comment list immediately
  // so that it’s shown in the UI.
  PostCommentsCache.updateWhenReady(postID, comments => {
    return comments.setItem(comments.items.length, {
      id: commentID,
      realtime: true,
    });
  });

  // Mark this comment as a locally published comment.
  locallyPublishedComments.add(commentID);

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

/**
 * Watches the comments on a post and keeps `PostCommentsCache` up to date as
 * new comments are added in realtime.
 */
export function watchPostComments(postID: PostID): {unsubscribe: () => void} {
  return API.comment.watchPostComments({postID}).subscribe({
    next(message) {
      switch (message.type) {
        // When we get the number of comments in our entire list as the very
        // first message of our subscription, we use that information to make
        // sure our comments skim list has the correct length.
        //
        // The skim list could have an outdated length based on
        // `post.commentCount` which might have changed since we last
        // fetched data.
        case "count": {
          PostCommentsCache.updateWhenReady(postID, comments => {
            return comments.setLength(message.commentCount);
          });
          break;
        }

        // When we get a new comment:
        //
        // 1. Insert the comment into our cache.
        // 2. Insert the comment into our realtime array of incoming comments.
        case "new": {
          const {comment} = message;

          // If this comment was locally published then don’t bother adding it
          // to our cache again. We call `delete()` to avoid leaking memory.
          if (locallyPublishedComments.delete(comment.id)) return;

          CommentCache.insert(comment.id, {
            status: CommentCacheEntryStatus.Commit,
            comment,
          });

          PostCommentsCache.updateWhenReady(postID, comments => {
            return comments.setItem(comments.items.length, {
              id: comment.id,
              realtime: true,
            });
          });
          break;
        }
      }
    },
    error() {
      // TODO: error handling
    },
  });
}
