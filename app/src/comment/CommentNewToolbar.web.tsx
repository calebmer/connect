import {Color, Shadow} from "../atoms";
import {StyleSheet, View} from "react-native";
import {CommentNew} from "./CommentNew";
import React from "react";
import {postMaxWidth} from "../post/postMaxWidth";

export function CommentNewToolbar() {
  return (
    <View style={styles.background}>
      <View style={styles.toolbar}>
        <CommentNew />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: {
    backgroundColor: Color.white,
    ...Shadow.elevation2,
    shadowOffset: {width: 0, height: 2},
  },
  toolbar: {
    maxWidth: postMaxWidth + CommentNew.sendButtonWidth,
  },
});
