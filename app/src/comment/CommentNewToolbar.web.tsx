import {StyleSheet, View} from "react-native";
import {CommentNew} from "./CommentNew";
import {CommentNewJumpButton} from "./CommentNewJumpButton";
import {PostID} from "@connect/api-client";
import React from "react";

export function CommentNewToolbar({
  postID,
  showJumpButton,
  onJumpToEnd,
}: {
  postID: PostID;
  showJumpButton: boolean;
  onJumpToEnd: () => void;
}) {
  return (
    <View>
      <View style={styles.jump} pointerEvents="box-none">
        <CommentNewJumpButton show={showJumpButton} onJumpToEnd={onJumpToEnd} />
      </View>
      <CommentNew postID={postID} onJumpToEnd={onJumpToEnd} />
    </View>
  );
}

const styles = StyleSheet.create({
  jump: {
    position: "absolute",
    top: -CommentNewJumpButton.fullHeight,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
});
