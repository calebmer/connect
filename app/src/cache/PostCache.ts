import {
  AccountID,
  DateTime,
  GroupID,
  Post,
  PostCursor,
  PostID,
} from "@connect/api-client";
import {API} from "../api/API";
import {AccountCache} from "./AccountCache";
import {Cache} from "./framework/Cache";
import {CacheList} from "./framework/CacheList";

/**
 * Caches posts by their ID.
 */
export const PostCache = new Cache<PostID, Post>({
  async load(id) {
    const {post} = await API.post.get({id});
    if (post == null) throw new Error("Post not found.");
    return post;
  },
});

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
      cursor: PostCursor.get,

      async load(range) {
        // Fetch the posts for this range from our API.
        const {posts} = await API.group.getPosts({groupID, ...range});

        // A set of all the accounts who authored posts.
        const accountIDSet = new Set<AccountID>();

        // Loop through all the posts and create cache entries for our post
        // list. Also insert each post into our `PostCache`.
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

        // We want to fetch all the account IDs which we do not have in
        // our cache.
        accountIDSet.forEach(accountID => {
          if (!AccountCache.has(accountID)) {
            accountIDs.push(accountID);
          }
        });

        // If there are some accounts we have not yet loaded in our cache then
        // send an API request to fetch those accounts.
        if (accountIDs.length > 0) {
          const {accounts} = await API.account.getManyProfiles({
            ids: accountIDs,
          });
          accounts.forEach(account => {
            AccountCache.insert(account.id, account);
          });
        }

        return entries;
      },
    });

    // Load the first few posts into our cache. We will suspend until we’ve
    // loaded the first few posts.
    await postCacheList.loadFirst(postCountInitial);

    return postCacheList;
  },
});
