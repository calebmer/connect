import {Breakpoint, useBreakpoint} from "./useBreakpoint";
import {Group, GroupRoute as GroupRouteComponent} from "./Group";
import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import {Post, PostRoute as PostRouteComponent} from "./Post";
import React, {useCallback, useEffect} from "react";
import {Shadow, Space} from "./atoms";
import {StyleSheet, View} from "react-native";
import {CurrentAccountCache} from "./cache/AccountCache";
import {GroupCache} from "./cache/GroupCache";
import {GroupHomeContainer} from "./GroupHomeContainer";
import {PostCacheList} from "./cache/PostCache";
import {PostID} from "@connect/api-client";
import {PostNewPopupContext} from "./PostNewPopupContext";
import {PostRoute} from "./router/AllRoutes";
import {Route} from "./router/Route";
import {useCacheData} from "./cache/framework/Cache";
import {useCacheListData} from "./cache/framework/CacheList";
import {useMutableContainer} from "./cache/framework/Mutable";

function GroupHome({
  route,
  groupSlug,
  postID: _postID,
  breakpoint,
}: {
  route: Route;
  groupSlug: string;
  postID?: string;
  breakpoint: Breakpoint;
}) {
  // Always preload the current account...
  CurrentAccountCache.preload();

  // Parse a post ID from our props which comes from the URL.
  const postID =
    _postID != null ? (parseInt(_postID, 10) as PostID) : undefined;

  return (
    <GroupHomeContainer>
      <PostNewPopupContext available={breakpoint > Breakpoint.Tablet}>
        <View style={styles.group}>
          <GroupSuspense route={route} groupSlug={groupSlug} postID={postID} />
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
        <GroupHome
          route={route}
          groupSlug={groupSlug}
          postID={postID}
          breakpoint={breakpoint}
        />
      </GroupHomeLayoutContext.Provider>
    );
  }
}

const styles = StyleSheet.create({
  group: {
    flex: 3,
    maxWidth: Space.space12,
  },
  post: {
    flex: 4,
    ...Shadow.elevation3,
  },
});
