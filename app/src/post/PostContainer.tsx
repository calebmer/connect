import {Color, Shadow} from "../atoms";
import {StyleProp, StyleSheet, View, ViewStyle} from "react-native";
import {ErrorBoundary} from "../frame/ErrorBoundary";
import {Post} from "./Post";
import {PostCache} from "./PostCache";
import {PostCommentsCache} from "../comment/CommentCache";
import {PostID} from "@connect/api-client";
import {PostShimmer} from "./PostShimmer";
import React from "react";
import {Route} from "../router/Route";

export function PostContainer({
  style,
  route,
  groupSlug,
  postID,
}: {
  style?: StyleProp<ViewStyle>;
  route: Route;
  groupSlug: string;
  postID: PostID | null;
}) {
  function handleRetry() {
    // Force ourselves to reload the post and comments before we retry.
    if (postID !== null) {
      PostCache.forceReload(postID);
      PostCommentsCache.forceReload(postID);
    }
  }

  return (
    <View style={[styles.container, style]}>
      <ErrorBoundary route={route} onRetry={handleRetry}>
        {postID != null ? (
          <React.Suspense fallback={<PostShimmer route={route} />}>
            <Post route={route} groupSlug={groupSlug} postID={postID} />
          </React.Suspense>
        ) : (
          <PostShimmer route={route} />
        )}
      </ErrorBoundary>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: Color.white,
    ...Shadow.elevation3,
  },
});
