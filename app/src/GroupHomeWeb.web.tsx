import {Color, Shadow, Space} from "./atoms";
import {Platform, StyleSheet, View} from "react-native";
import {Group} from "./Group";
import {Post} from "./Post";
import {PostID} from "@connect/api-client";
import React from "react";
import {Route} from "./router/Route";

if (Platform.OS !== "web") {
  throw new Error("Can only use this module on the web.");
}

export function GroupHomeWeb({
  route,
  groupSlug,
  postID: _postID,
}: {
  route: Route;
  groupSlug: string;
  postID?: string;
}) {
  const postID =
    _postID != null ? (parseInt(_postID, 10) as PostID) : undefined;

  return (
    <View style={styles.container}>
      <Group route={route} groupSlug={groupSlug} />
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
