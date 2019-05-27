import {Breakpoint, useBreakpoint} from "../utils/Breakpoint";
import {Group, GroupRoute as GroupRouteComponent} from "./Group";
import {Platform, StyleSheet, View} from "react-native";
import React, {useCallback, useEffect, useRef} from "react";
import {useCache, useCacheWithPrev} from "../cache/Cache";
import {CurrentAccountCache} from "../account/AccountCache";
import {GroupCache} from "./GroupCache";
import {GroupHomeContainer} from "./GroupHomeContainer";
import {GroupPostsCache} from "../post/PostCache";
import {PostContainer} from "../post/PostContainer";
import {PostID} from "@connect/api-client";
import {PostNewPopupContext} from "../post/PostNewPopupContext";
import {PostRoute} from "../router/AllRoutes";
import {Route} from "../router/Route";
import {Space} from "../atoms";
import {useGroupHomeLayout} from "./useGroupHomeLayout";
import {useMutableContainer} from "../cache/Mutable";

function GroupHome({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID?: PostID;
}) {
  // Always preload the current account...
  CurrentAccountCache.preload();

  return (
    <GroupHomeContainer>
      <PostNewPopupContext
        route={route}
        groupSlug={groupSlug}
        available={useBreakpoint() > Breakpoint.Tablet}
      >
        <View style={styles.group}>
          <GroupSuspense route={route} groupSlug={groupSlug} postID={postID} />
        </View>
        <PostContainer
          key={postID} // NOTE: Use a key so that React re-mounts the component when the ID changes.
          route={route}
          groupSlug={groupSlug}
          postID={postID || null}
        />
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
  const postID = _postID as PostID | undefined;

  const groupHomeLayout = useGroupHomeLayout();

  // NOTE: We use `history.replaceState()` to redirect the user to the first
  // post in a group. This works well in our layered group home layout, but on
  // mobile the group and post are two separate routes. When we switch between
  // our mobile and laptop layouts on web, edit the browser history so that
  // you can get back to the group route by pressing the back button.
  const lastGroupHomeLayout = useRef(groupHomeLayout);
  useEffect(() => {
    if (
      Platform.OS === "web" &&
      lastGroupHomeLayout.current !== groupHomeLayout &&
      groupHomeLayout === false &&
      postID !== undefined
    ) {
      window.history.replaceState({}, "group", `/group/${groupSlug}`);
      window.history.pushState(
        {},
        "post",
        `/group/${groupSlug}/post/${postID}`,
      );
    }
    lastGroupHomeLayout.current = groupHomeLayout;
  }, [groupHomeLayout, groupSlug, postID, route]);

  if (groupHomeLayout) {
    return <GroupHome route={route} groupSlug={groupSlug} postID={postID} />;
  } else {
    if (postID == null) {
      return <GroupRouteComponent route={route} groupSlug={groupSlug} />;
    } else {
      return (
        <PostContainer
          route={route}
          groupSlug={groupSlug}
          postID={postID || null}
        />
      );
    }
  }
}

const styles = StyleSheet.create({
  group: {
    flex: 3 / 4,
    maxWidth: Space.space12,
  },
});
