import {Font, Space} from "../atoms";
import {ScrollView, StyleSheet, View} from "react-native";
import {CommentNew} from "./CommentNew";
import {CommentNewJumpButton} from "./CommentNewJumpButton";
import {KeyboardTrackingView} from "react-native-keyboard-tracking-view";
import {PostID} from "@connect/api-client";
import React from "react";

export function CommentNewToolbar({
  postID,
  showJumpButton,
  scrollViewRef,
}: {
  postID: PostID;
  showJumpButton: boolean;
  scrollViewRef: React.RefObject<ScrollView>;
}) {
  return (
    <>
      <View style={styles.jump} pointerEvents="box-none">
        <CommentNewJumpButton
          show={showJumpButton}
          scrollViewRef={scrollViewRef}
        />
      </View>
      <KeyboardTrackingView
        style={styles.toolbar}
        requiresSameParentToManageScrollView
        scrollBehavior="KeyboardTrackingScrollBehaviorFixedOffset"
      >
        <CommentNew postID={postID} />
      </KeyboardTrackingView>
    </>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  jump: {
    position: "absolute",
    bottom:
      CommentNewJumpButton.marginBottom +
      Font.size2.lineHeight +
      Space.space3 * 2,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
});
