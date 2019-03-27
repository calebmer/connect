import {
  AccountID,
  DateTime,
  Group,
  GroupID,
  PostCursor,
  PostID,
} from "@connect/api-client";
import {API} from "../api/API";
import {AccountCache} from "./AccountCache";
import {Cache} from "./framework/Cache";
import {CacheList} from "./framework/CacheList";
import {PostCache} from "./PostCache";

/** The number of posts we load for a group in our initial fetch. */
export const groupPostCountInitial = 16;

/** The number of posts we load for a group as we are scrolling. */
export const groupPostCountMore = 8;

/**
 * An entry for a `Group` in our group `Cache`.
 *
 * Each group also has a `CacheList` for all the posts in the group.
 */
export type GroupCacheEntry = {
  readonly group: Group;
  readonly postCacheList: PostCacheList;
};

/**
 * Type for a `CacheList` of `Post`s.
 */
export type PostCacheList = CacheList<PostCursor, PostCacheListEntry>;

/**
 * An entry for a `Post` in a `CacheList`. Notice how this only has the post ID?
 * To get the full post object use the ID to fetch the data from `postCache`.
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
  if (group == null) throw new Error("Group not found.");

  // Create a fresh cache for our group’s posts.
  const postCacheList = PostCacheList(group.id);

  // Load the first few posts into our cache. Don’t return the group until we
  // have done this.
  await postCacheList.loadFirst(groupPostCountInitial);

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
      const {posts} = await API.group.getPosts({groupID, ...range});

      // A set of all the accounts who authored posts.
      const accountIDSet = new Set<AccountID>();

      // Loop through all the posts and create cache entries for our post list.
      // Also insert each post into our `PostCache`.
      const entries = posts.map<PostCacheListEntry>(post => {
        PostCache.insert(post.id, post);
        accountIDSet.add(post.authorID);
        return {
          id: post.id,
          publishedAt: post.publishedAt,
        };
      });

      // A set of all the accounts we want to fetch from our API.
      const accountIDs: Array<AccountID> = [];

      // We want to fetch all the account IDs which we do not have in our cache.
      accountIDSet.forEach(accountID => {
        if (!AccountCache.has(accountID)) {
          accountIDs.push(accountID);
        }
      });

      // If there are some accounts we have not yet loaded in our cache then
      // send an API request to fetch those accounts.
      if (accountIDs.length > 0) {
        const {accounts} = await API.account.getManyProfiles({ids: accountIDs});
        accounts.forEach(account => {
          AccountCache.insert(account.id, account);
        });
      }

      return entries;
    },
  });
}
