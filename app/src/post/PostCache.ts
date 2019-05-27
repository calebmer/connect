import {
  AccountID,
  DateTime,
  GroupID,
  Post,
  PostCursor,
  PostID,
  RangeDirection,
  generateID,
} from "@connect/api-client";
import {API} from "../api/API";
import {AccountCache} from "../account/AccountCache";
import {AppError} from "../api/AppError";
import {Cache} from "../cache/Cache";
import {ErrorAlert} from "../frame/ErrorAlert";
import {Paginator} from "../cache/Paginator";
import {Repair} from "../cache/Repair";

/**
 * Caches posts by their ID.
 */
export const PostCache = new Cache<PostID, Post>({
  async load(id) {
    const {post} = await API.post.getPost({id});
    if (post == null) {
      throw new AppError("Can not find this post.");
    }
    AccountCache.preload(post.authorID); // Preload the post’s author. We will probably need that.
    return post;
  },
});

// Register the cache for repairing when requested by the user...
Repair.registerCache(PostCache);

/**
 * An entry for a `Post` in a `CacheList`. Notice how this only has the post ID?
 * To get the full post object use the ID to fetch the data from `PostCache`.
 * We also include the time at which the post was published so that we can
 * create the `PostCursor` from a cache entry.
 */
export type GroupPostsCacheEntry = {
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
export const GroupPostsCache = new Cache<
  GroupID,
  Paginator<PostCursor, GroupPostsCacheEntry>
>({
  async load(groupID) {
    const posts = Paginator.create<PostCursor, GroupPostsCacheEntry>({
      direction: RangeDirection.First,
      cursor: PostCursor.get,

      async load(range) {
        // Fetch the posts for this range from our API.
        const {posts} = await API.post.getGroupPosts({groupID, ...range});

        // All the accounts we want to preload.
        const accountIDs = new Set<AccountID>();

        // Loop through all the posts and create cache entries for our post
        // list. Also insert each post into our `PostCache`.
        const entries = posts.map(post => {
          PostCache.insert(post.id, post);
          accountIDs.add(post.authorID);
          const entry: GroupPostsCacheEntry = {
            id: post.id,
            publishedAt: post.publishedAt,
          };
          return entry;
        });

        // Load post authors since we’ll probably want those when
        // rendering a post.
        await AccountCache.loadMany(accountIDs);

        return entries;
      },
    });

    return await posts.loadMore(postCountInitial);
  },
});

// Register the cache for repairing when requested by the user...
Repair.registerCache(GroupPostsCache);

/**
 * Publishes a new post! Unlike `publishComment()`, we do not optimistically add
 * the post to our cache. Instead we wait until the post has been published
 * before returning.
 *
 * This function should never throw. Instead if we failed to publish then we
 * will return `null` instead of a post ID.
 */
export async function publishPost({
  authorID,
  groupID,
  content,
}: {
  authorID: AccountID;
  groupID: GroupID;
  content: string;
}): Promise<PostID | null> {
  try {
    // Generate a new ID for our post. The ID we generate should be globally
    // unique thanks to our algorithm.
    const postID = generateID<PostID>();

    // Actually publish the post using our API! The API will give us the server
    // assigned publish date.
    const {publishedAt} = await API.post.publishPost({
      id: postID,
      groupID,
      content,
    });

    // Create the final post object.
    const post: Post = {
      id: postID,
      groupID,
      authorID,
      publishedAt,
      commentCount: 0,
      content: content.trim(),
    };

    // Insert the final post object into the cache.
    PostCache.insert(postID, post);

    // Insert our post as a phantom item in our group post list immediately so
    // that it’s shown in the UI.
    GroupPostsCache.updateWhenReady(groupID, posts => {
      return posts.insert({
        id: postID,
        publishedAt: post.publishedAt,
      });
    });

    return postID;
  } catch (error) {
    // Display the error to the user...
    ErrorAlert.alert(error, "Could not publish your post");

    return null;
  }
}
