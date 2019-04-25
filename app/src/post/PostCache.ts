import {
  AccountID,
  DateTime,
  GroupID,
  Post,
  PostCursor,
  PostID,
  generateID,
} from "@connect/api-client";
import {API} from "../api/API";
import {AccountCache} from "../account/AccountCache";
import {Cache} from "../cache/Cache";
import {CacheList} from "../cache/CacheList";

/**
 * Caches posts by their ID.
 */
export const PostCache = new Cache<PostID, PostCacheEntry>({
  async load(id) {
    const {post} = await API.post.getPost({id});
    if (post == null) throw new Error("Post not found.");
    AccountCache.preload(post.authorID); // Preload the post’s author. We will probably need that.
    return {
      status: PostCacheEntryStatus.Commit,
      post,
    };
  },
});

/**
 * The status of a `PostCacheEntry`. Uses common lingo from transaction status.
 */
enum PostCacheEntryStatus {
  /** The cache entry is optimistic and has not yet been committed. */
  Pending,
  /** The cache entry is fully commit to the backend, hooray! */
  Commit,
  /** The cache entry failed to commit so we need to roll it back. */
  Rollback,
}

/**
 * An entry for a post in our `PostCache`. It contains the post data from the
 * API and other status information about the post.
 *
 * When we publish a post we insert a cache entry with a status of
 * “pending”. When we finish publishing the post we change the status to
 * “commit”. If we fail to publish the post we change the status to “rollback”.
 */
type PostCacheEntry = {
  readonly status: PostCacheEntryStatus;
  readonly post: Post;
};

/**
 * An entry for a `Post` in a `CacheList`. Notice how this only has the post ID?
 * To get the full post object use the ID to fetch the data from `PostCache`.
 * We also include the time at which the post was published so that we can
 * create the `PostCursor` from a cache entry.
 */
export type PostCacheListEntry = {
  readonly id: PostID;
  readonly publishedAt: DateTime;
};

/** The number of posts we load for a group in our initial fetch. */
export const postCountInitial = 16;

/** The number of posts we load for a group as we are scrolling. */
export const postCountMore = 8;

/**
 * A cache which holds a list of posts for each group. When loading a list from
 * this cache, we load the first few posts before returning the list.
 */
export const PostCacheList = new Cache<
  GroupID,
  CacheList<PostCursor, PostCacheListEntry>
>({
  async load(groupID) {
    // Create the post cache list...
    const postCacheList = new CacheList<PostCursor, PostCacheListEntry>({
      key: ({id}) => id,
      cursor: PostCursor.get,

      async load(range) {
        // Fetch the posts for this range from our API.
        const {posts} = await API.post.getGroupPosts({groupID, ...range});

        // All the accounts we want to preload.
        const accountIDs = new Set<AccountID>();

        // Loop through all the posts and create cache entries for our post
        // list. Also insert each post into our `PostCache`.
        const entries = posts.map<PostCacheListEntry>(post => {
          PostCache.insert(post.id, {
            status: PostCacheEntryStatus.Commit,
            post,
          });
          accountIDs.add(post.authorID);
          return {
            id: post.id,
            publishedAt: post.publishedAt,
          };
        });

        // Load post authors since we’ll probably want those when
        // rendering a post.
        await AccountCache.loadMany(accountIDs);

        return entries;
      },
    });

    // Load the first few posts into our cache. We will suspend until we’ve
    // loaded the first few posts.
    await postCacheList.loadFirst(postCountInitial);

    return postCacheList;
  },
});

/**
 * Publishes a new post! Immediately generates a new post ID and inserts a
 * pending post object into the cache. We return the new post ID synchronously
 * so that the caller can optimistically display the new post.
 *
 * We then trigger an asynchronous API call to actually publish the post in the
 * background. If the API fails then we will change the status of our cache
 * entry to reflect the failure.
 */
export function publishPost({
  authorID,
  groupID,
  content,
}: {
  authorID: AccountID;
  groupID: GroupID;
  content: string;
}): PostID {
  // Generate a new ID for our post. The ID we generate should be globally
  // unique thanks to our algorithm.
  const postID = generateID<PostID>();

  // Create a pending post object. This is what the final post _should_
  // look like.
  const pendingPost: Post = {
    id: postID,
    groupID,
    authorID,
    publishedAt: DateTime.now(), // The server will assign a definitive timestamp.
    content,
  };

  // Insert our pending post into the cache! This way it will
  // render immediately.
  PostCache.insert(postID, {
    status: PostCacheEntryStatus.Pending,
    post: pendingPost,
  });

  // Insert our post as a phantom item in our group post list immediately so
  // that it’s shown in the UI. Ignore any async errors...
  PostCacheList.load(groupID)
    .then(postCacheList => {
      return postCacheList.insertPhantomFirst({
        id: postID,
        publishedAt: pendingPost.publishedAt,
      });
    })
    .catch(() => {});

  // TODO: Error handling!
  (async () => {
    try {
      // Actually publish the post using our API! The API will give us the server
      // assigned publish date.
      const {publishedAt} = await API.post.publishPost({
        id: postID,
        groupID,
        content,
      });

      // Insert the final post object into the cache and flip the status
      // to “commit”.
      PostCache.insert(postID, {
        status: PostCacheEntryStatus.Commit,
        post: {...pendingPost, publishedAt},
      });
    } catch (error) {
      // If we failed to insert the post then make sure to reflect that in
      // our UI.
      PostCache.insert(postID, {
        status: PostCacheEntryStatus.Rollback,
        post: pendingPost,
      });

      throw error;
    }
  })();

  return postID;
}
