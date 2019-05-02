import {ScrollView, StyleSheet} from "react-native";
import {CommentNew} from "./CommentNew";
import {KeyboardTrackingView} from "react-native-keyboard-tracking-view";
import {PostID} from "@connect/api-client";
import React from "react";

export function CommentNewToolbar({
  postID,
  scrollViewRef,
}: {
  postID: PostID;
  scrollViewRef: React.RefObject<ScrollView>;
}) {
  return (
    <KeyboardTrackingView
      style={styles.toolbar}
      requiresSameParentToManageScrollView
      scrollBehavior="KeyboardTrackingScrollBehaviorFixedOffset"
    >
      <CommentNew postID={postID} scrollViewRef={scrollViewRef} />
    </KeyboardTrackingView>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
});
