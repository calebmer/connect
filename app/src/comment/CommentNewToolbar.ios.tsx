import {Color, Shadow} from "../atoms";
import {Platform, StyleSheet, View} from "react-native";
import {CommentNew} from "./CommentNew";
import {KeyboardTrackingView} from "react-native-keyboard-tracking-view";
import React from "react";

export function CommentNewToolbar() {
  return (
    <KeyboardTrackingView
      style={styles.toolbar}
      scrollBehavior="KeyboardTrackingScrollBehaviorFixedOffset"
    >
      <View style={styles.background} />
      <CommentNew />
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
