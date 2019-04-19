import {Font, Space} from "../atoms";
import {StyleSheet, View} from "react-native";
import {Editor} from "../editor/Editor";
import {IconPatch} from "../molecules/IconPatch";
import React from "react";

export function CommentNew({disabled}: {disabled?: boolean}) {
  return (
    <View style={styles.container}>
      <View style={styles.editor}>
        <Editor placeholder="Write a comment…" disabled={disabled} />
      </View>
      <View style={styles.send}>
        <IconPatch icon="send" />
      </View>
    </View>
  );
}

CommentNew.minHeight = Font.size2.lineHeight - 3 + Space.space3 * 2;
CommentNew.maxHeight = Font.size2.lineHeight * 5 + Space.space3 * 2;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    minHeight: CommentNew.minHeight,
    maxHeight: CommentNew.maxHeight,
  },
  editor: {
    flex: 1,
  },
  send: {
    paddingVertical: (CommentNew.minHeight - IconPatch.size) / 2,
    paddingHorizontal: Space.space3,
  },
});
