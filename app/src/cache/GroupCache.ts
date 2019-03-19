import {
  DateTime,
  Group,
  GroupID,
  PostCursor,
  PostID,
} from "@connect/api-client";
import {API} from "../api/API";
import {Cache} from "./Cache";
import {CacheList} from "./CacheList";
import {PostCache} from "./PostCache";

/**
 * An entry for a `Group` in our group `Cache`.
 *
 * Each group also has a `CacheList` for all the posts in the group.
 */
export type GroupCacheEntry = {
  readonly group: Group;
  readonly postCacheList: CacheList<PostCursor, PostCacheListEntry>;
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

/**
 * Caches groups by their URL slug.
 */
export const GroupCache = new Cache<string, GroupCacheEntry>(async slug => {
  // Get the group by its slug from our API.
  const {group} = await API.group.getBySlug({slug});

  // Create a fresh cache for our group’s posts.
  const postCacheList = PostCacheList(group.id);

  return {
    group,
    postCacheList,
  };
});

/**
 * Creates a new `CacheList` for all the `Post`s in a group.
 */
function PostCacheList(groupID: GroupID) {
  return new CacheList<PostCursor, PostCacheListEntry>({
    cursor: PostCursor.get,

    async load(range) {
      // Fetch the posts for this range from our API.
      const {posts} = await API.group.getPosts({id: groupID, ...range});

      // Loop through all the posts and create cache entries for our post list.
      // Also insert each post into our `PostCache`.
      const entries = posts.map<PostCacheListEntry>(post => {
        PostCache.insert(post.id, post);
        return {
          id: post.id,
          publishedAt: post.publishedAt,
        };
      });

      return entries;
    },
  });
}
