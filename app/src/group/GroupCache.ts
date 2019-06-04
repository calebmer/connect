import {Cache, useCache} from "../cache/Cache";
import {Group, GroupID, GroupMembership} from "@connect/api-client";
import {API} from "../api/API";
import {AccountCache} from "../account/AccountCache";
import {AppError} from "../api/AppError";
import {CacheSingleton} from "../cache/CacheSingleton";
import {Image} from "react-native";
import defaultBackgroundImage from "../assets/images/group-banner-background.png";

/**
 * Caches groups by their ID.
 */
export const GroupCache = new Cache<GroupID, Group>({
  async load(id) {
    // We can use `getGroupBySlug()` since it detects whether or not the string
    // is an ID or slug.
    const {group} = await API.group.getGroupBySlug({slug: id});
    if (group == null) {
      throw new AppError("Can not find this group.");
    }

    await preloadGroupBackground(group);

    // Insert the appropriate relationships into our `GroupSlugCache`.
    GroupSlugCache.insert(group.id, group.id);
    if (group.slug !== null) GroupSlugCache.insert(group.slug, group.id);

    return group;
  },
});

/**
 * Caches the relationship between a group slug and the group ID associated with
 * that slug. After we fetch we’ll insert the group into `GroupCache`.
 */
export const GroupSlugCache = new Cache<string, GroupID>({
  async load(slug) {
    const {group} = await API.group.getGroupBySlug({slug});
    if (group == null) {
      throw new AppError("Can not find this group.");
    }

    await preloadGroupBackground(group);

    GroupCache.insert(group.id, group);

    // If our fetched group has a slug and the slug is not equal to what we
    // requested (presumably we requested with an ID) then insert a relation
    // into our group slug cache.
    if (group.slug !== null && group.slug !== slug) {
      GroupSlugCache.insert(group.slug, group.id);
    }

    return group.id;
  },
});

/**
 * Caches the members of each group. Currently holds _all_ the group members at
 * once. This is not scalable. Eventually we will need to incrementally load
 * the list of group members.
 */
export const GroupMembershipsCache = new Cache<
  GroupID,
  ReadonlyArray<GroupMembership>
>({
  async load(id) {
    const {memberships, accounts} = await API.group.getAllGroupMemberships({
      id,
    });

    // Insert any accounts we received into our account cache.
    accounts.forEach(account => {
      AccountCache.insert(account.id, account);
    });

    return memberships;
  },
});

/**
 * Cache that holds the group memberships for our current account.
 */
export const CurrentGroupMembershipsCache = new CacheSingleton<
  ReadonlyArray<GroupID>
>(async () => {
  const {groups} = await API.account.getCurrentGroupMemberships();

  return groups.map(group => {
    GroupCache.insert(group.id, group);
    GroupSlugCache.insert(group.id, group.id);
    if (group.slug) GroupSlugCache.insert(group.slug, group.id);
    return group.id;
  });
});

/**
 * Preloads the account’s avatar if one exists. Any errors while loading the
 * avatar are ignored.
 */
async function preloadGroupBackground(_group: Group): Promise<void> {
  // TODO: Actually prefetch the group background image. Currently we only fetch
  // the default background image.

  if (typeof defaultBackgroundImage === "string") {
    try {
      await Image.prefetch(defaultBackgroundImage);
    } catch (error) {
      // ignore error
    }
  }
}

/**
 * Fetches a group from our cache using the slug of the group.
 */
export function useGroupWithSlug(groupSlug: string): Group {
  const groupID = useCache(GroupSlugCache, groupSlug);
  const group = useCache(GroupCache, groupID);
  return group;
}
