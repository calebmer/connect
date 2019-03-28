import {Breakpoint, useBreakpoint} from "./useBreakpoint";
import {Color, Shadow, Space} from "./atoms";
import {Group, GroupRoute as GroupRouteComponent} from "./Group";
import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import {Post, PostRoute as PostRouteComponent} from "./Post";
import React, {useCallback, useEffect} from "react";
import {StyleSheet, View} from "react-native";
import {CurrentAccountCache} from "./cache/AccountCache";
import {GroupCache} from "./cache/GroupCache";
import {PostID} from "@connect/api-client";
import {PostRoute} from "./router/AllRoutes";
import {Route} from "./router/Route";
import {useCacheData} from "./cache/framework/Cache";
import {useCacheListData} from "./cache/framework/CacheList";

function GroupHome({
  route,
  groupSlug,
  postID: _actualPostID,
}: {
  route: Route;
  groupSlug: string;
  postID?: string;
}) {
  // Always preload the current account...
  CurrentAccountCache.preload();

  // Parse a post ID from our props which comes from the URL.
  const actualPostID =
    _actualPostID != null ? (parseInt(_actualPostID, 10) as PostID) : undefined;

  // Get the list of posts for this component.
  const {group, postCacheList} = useCacheData(GroupCache, groupSlug);
  const {loading, items: posts} = useCacheListData(postCacheList);

  // If we weren’t provided a post ID then use the ID of the first post in
  // our group.
  const postID =
    actualPostID == null && posts.length > 0 ? posts[0].id : actualPostID;

  // If we are rendering a different post ID then the one we were provided,
  // update our route so that it points to the actual post we are rendering.
  useEffect(() => {
    if (actualPostID !== postID) {
      route.webReplace(PostRoute, {groupSlug, postID: String(postID)});
    }
  }, [actualPostID, groupSlug, postID, route]);

  return (
    <View style={styles.container}>
      <View style={styles.group}>
        <Group
          route={route}
          group={group}
          posts={posts}
          selectedPostID={postID}
          loadingMorePosts={loading}
          onLoadMorePosts={useCallback(count => postCacheList.loadNext(count), [
            postCacheList,
          ])}
        />
      </View>
      <View style={styles.post}>
        {postID != null && (
          <Post
            key={postID} // NOTE: Use a key so that React re-mounts the component when the ID changes.
            route={route}
            groupSlug={groupSlug}
            postID={postID}
          />
        )}
      </View>
    </View>
  );
}

/**
 * The component we actually render for this route. If the screen is large
 * enough we will use a layered layout.
 */
export function GroupHomeRoute({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID?: string;
}) {
  const breakpoint = useBreakpoint();

  if (breakpoint <= Breakpoint.TabletSmall) {
    if (postID == null) {
      return <GroupRouteComponent route={route} groupSlug={groupSlug} />;
    } else {
      return (
        <PostRouteComponent
          route={route}
          groupSlug={groupSlug}
          postID={postID}
        />
      );
    }
  } else {
    return (
      <GroupHomeLayoutContext.Provider value={GroupHomeLayout.Laptop}>
        <GroupHome route={route} groupSlug={groupSlug} postID={postID} />
      </GroupHomeLayoutContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  group: {
    flex: 3,
    maxWidth: Space.space12,
  },
  post: {
    flex: 4,
    padding: Space.space2,
    backgroundColor: Color.white,
    ...Shadow.elevation3,
  },
});
