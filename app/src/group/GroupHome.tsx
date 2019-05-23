import {Breakpoint, useBreakpoint} from "../utils/useBreakpoint";
import {Group, GroupRoute as GroupRouteComponent} from "./Group";
import React, {useCallback, useEffect} from "react";
import {StyleSheet, View} from "react-native";
import {useCache, useCacheWithPrev} from "../cache/Cache";
import {CurrentAccountCache} from "../account/AccountCache";
import {GroupCache} from "./GroupCache";
import {GroupHomeContainer} from "./GroupHomeContainer";
import {GroupHomeLayout} from "./GroupHomeLayout";
import {GroupPostsCache} from "../post/PostCache";
import {Post} from "../post/Post";
import {PostID} from "@connect/api-client";
import {PostNewPopupContext} from "../post/PostNewPopupContext";
import {PostRoute} from "../router/AllRoutes";
import {PostShimmer} from "../post/PostShimmer";
import {Route} from "../router/Route";
import {Space} from "../atoms";
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
        {postID != null ? (
          <Post
            key={postID} // NOTE: Use a key so that React re-mounts the component when the ID changes.
            route={route}
            groupSlug={groupSlug}
            postID={postID}
          />
        ) : (
          <PostShimmer />
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
  const group = useCache(GroupCache, groupSlug);
  const {loading, data: posts} = useCacheWithPrev(GroupPostsCache, group.id);

  // If we are rendering a different post ID then the one we were provided,
  // update our route so that it points to the actual post we are rendering.
  //
  // NOTE: Ideally there should be no flash of empty content in the post panel
  // before we redirect.
  useEffect(() => {
    if (postID == null && posts.items.length > 0) {
      route.webReplace(PostRoute, {
        groupSlug,
        postID: String(posts.items[0].id),
      });
    }
  }, [groupSlug, postID, posts.items, route]);

  return (
    <Group
      route={route}
      group={group}
      posts={posts.items}
      selectedPostID={useMutableContainer(postID)}
      loadingMorePosts={!posts.noMoreItems || loading}
      onLoadMorePosts={useCallback(
        count => {
          if (!GroupPostsCache.isLoading(group.id)) {
            GroupPostsCache.updateWhenReady(group.id, posts => {
              return posts.loadMore(count);
            });
          }
        },
        [group.id],
      )}
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
      return <Post route={route} groupSlug={groupSlug} postID={postID} />;
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
    flex: 3 / 4,
    maxWidth: Space.space12,
  },
});
