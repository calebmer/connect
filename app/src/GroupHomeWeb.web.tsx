import {Color, Shadow, Space} from "./atoms";
import {Platform, StyleSheet, View} from "react-native";
import React, {useEffect} from "react";
import {CurrentAccountCache} from "./cache/AccountCache";
import {Group} from "./Group";
import {GroupCache} from "./cache/GroupCache";
import {Post} from "./Post";
import {PostID} from "@connect/api-client";
import {PostRoute} from "./router/AllRoutes";
import {Route} from "./router/Route";
import {useCacheData} from "./cache/framework/Cache";
import {useCacheListData} from "./cache/framework/CacheList";

if (Platform.OS !== "web") {
  throw new Error("Can only use this module on the web.");
}

export function GroupHomeWeb({
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
      <Group
        route={route}
        group={group}
        posts={posts}
        selectedPostID={postID}
        loadingMorePosts={loading}
        onLoadMorePosts={count => postCacheList.loadNext(count)}
      />
      <View style={styles.content}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
  content: {
    width: `calc(100vw - ${Space.space12}px)`,
    padding: Space.space2,
    backgroundColor: Color.white,
    ...Shadow.elevation3,
  },
});
