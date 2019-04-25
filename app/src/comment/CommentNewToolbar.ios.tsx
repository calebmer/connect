import {Color, Shadow} from "../atoms";
import {Platform, StyleSheet, View} from "react-native";
import {CommentNew} from "./CommentNew";
import {KeyboardTrackingView} from "react-native-keyboard-tracking-view";
import {PostID} from "@connect/api-client";
import React from "react";

export function CommentNewToolbar({postID}: {postID: PostID}) {
  return (
    <KeyboardTrackingView
      style={styles.toolbar}
      requiresSameParentToManageScrollView
      scrollBehavior="KeyboardTrackingScrollBehaviorFixedOffset"
    >
      <View style={styles.background} />
      <CommentNew postID={postID} />
    </KeyboardTrackingView>
  );
}

// For the iPhone X bottom area.
const paddingBottom = Platform.OS === "ios" ? 50 : 0;

const styles = StyleSheet.create({
  toolbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  background: {
    position: "absolute",
    top: 0,
    bottom: -paddingBottom,
    left: 0,
    right: 0,
    backgroundColor: Color.white,
    ...Shadow.elevation2,
  },
});
