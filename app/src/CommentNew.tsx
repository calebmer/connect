import {Color, Font, Shadow, Space} from "./atoms";
import {StyleSheet, View} from "react-native";
import {Editor} from "./Editor";
import React from "react";

export function CommentNew({disabled}: {disabled?: boolean}) {
  return (
    <View style={styles.container}>
      <Editor placeholder="Write a comment…" disabled={disabled} />
    </View>
  );
}

CommentNew.minHeight = Font.size3.lineHeight + Space.space3 * 2;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Color.white,
    ...Shadow.elevation2,
  },
});
