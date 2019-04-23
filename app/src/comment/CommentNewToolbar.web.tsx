import {Color, Shadow} from "../atoms";
import {StyleSheet, View} from "react-native";
import {CommentNew} from "./CommentNew";
import React from "react";

export function CommentNewToolbar() {
  return (
    <View style={styles.toolbar}>
      <CommentNew />
    </View>
  );
}

CommentNewToolbar.minHeight = CommentNew.minHeight;

const styles = StyleSheet.create({
  toolbar: {
    backgroundColor: Color.white,
    ...Shadow.elevation2,
    shadowOffset: {width: 0, height: 2},
  },
});
