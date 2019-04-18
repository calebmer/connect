import {Platform, StyleSheet} from "react-native";
import {CommentNew} from "./CommentNew";
import {KeyboardTrackingView} from "react-native-keyboard-tracking-view";
import React from "react";

export function CommentNewToolbar() {
  return (
    <KeyboardTrackingView style={styles.toolbar} manageScrollView={false}>
      <CommentNew style={styles.input} />
    </KeyboardTrackingView>
  );
}

CommentNewToolbar.minHeight = CommentNew.minHeight;

// For the iPhone X bottom area.
const paddingBottom = Platform.OS === "ios" ? 50 : 0;

const styles = StyleSheet.create({
  toolbar: {
    position: "absolute",
    bottom: -paddingBottom,
    left: 0,
    right: 0,
  },
  input: {
    paddingBottom: paddingBottom,
  },
});
