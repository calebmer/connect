import {Breakpoint, useBreakpoint} from "../utils/useBreakpoint";
import {Group, GroupRoute as GroupRouteComponent} from "./Group";
import {Post, Post as PostRouteComponent} from "../post/Post";
import React, {useCallback, useEffect} from "react";
import {StyleSheet, View} from "react-native";
import {CurrentAccountCache} from "../account/AccountCache";
import {GroupCache} from "./GroupCache";
import {GroupHomeContainer} from "./GroupHomeContainer";
import {GroupHomeLayout} from "./GroupHomeLayout";
import {PostCacheList} from "../post/PostCache";
import {PostID} from "@connect/api-client";
import {PostNewPopupContext} from "../post/PostNewPopupContext";
import {PostRoute} from "../router/AllRoutes";
import {Route} from "../router/Route";
import {Space} from "../atoms";
import {useCacheData} from "../cache/Cache";
import {useCacheListData} from "../cache/CacheList";
import {useMutableContainer} from "../cache/Mutable";

function GroupHome({
  route,
  groupSlug,
  postID,
  breakpoint,
}: {
  route: Route;
  groupSlug: string;
  postID?: PostID;
  breakpoint: Breakpoint;
}) {
  // Always preload the current account...
  CurrentAccountCache.preload();

  return (
    <GroupHomeContainer>
      <PostNewPopupContext
        route={route}
        groupSlug={groupSlug}
        available={breakpoint > Breakpoint.Tablet}
      >
        <View style={styles.group}>
          <GroupSuspense route={route} groupSlug={groupSlug} postID={postID} />
        </View>
        {postID != null && (
          <Post
            key={postID} // NOTE: Use a key so that React re-mounts the component when the ID changes.
            route={route}
            groupSlug={groupSlug}
            postID={postID}
          />
        )}
      </PostNewPopupContext>
    </GroupHomeContainer>
  );
}

function GroupSuspense({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID | undefined;
}) {
  // Get the list of posts for this component.
  const group = useCacheData(GroupCache, groupSlug);
  const postCacheList = useCacheData(PostCacheList, group.id);
  const {loading, items: posts} = useCacheListData(postCacheList);

  // If we are rendering a different post ID then the one we were provided,
  // update our route so that it points to the actual post we are rendering.
  //
  // NOTE: Ideally there should be no flash of empty content in the post panel
  // before we redirect.
  useEffect(() => {
    if (postID == null && posts.length > 0) {
      route.webReplace(PostRoute, {groupSlug, postID: String(posts[0].id)});
    }
  }, [groupSlug, postID, posts, route]);

  return (
    <Group
      route={route}
      group={group}
      posts={posts}
      selectedPostID={useMutableContainer(postID)}
      loadingMorePosts={loading}
      onLoadMorePosts={useCallback(count => postCacheList.loadNext(count), [
        postCacheList,
      ])}
    />
  );
}

/**
 * The component we actually render for this route. If the screen is large
 * enough we will use a layered layout.
 */
export function GroupHomeRoute({
  route,
  groupSlug,
  postID: _postID,
}: {
  route: Route;
  groupSlug: string;
  postID?: string;
}) {
  const postID = _postID as PostID;

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
      <GroupHomeLayout.Context.Provider value={GroupHomeLayout.Laptop}>
        <GroupHome
          route={route}
          groupSlug={groupSlug}
          postID={postID}
          breakpoint={breakpoint}
        />
      </GroupHomeLayout.Context.Provider>
    );
  }
}

const styles = StyleSheet.create({
  group: {
    maxWidth: Space.space12,
  },
});
