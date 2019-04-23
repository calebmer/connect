import {Font, Space} from "../atoms";
import React, {useState} from "react";
import {StyleSheet, View} from "react-native";
import {Editor} from "../editor/Editor";
import {IconPatch} from "../molecules/IconPatch";
import {IconPatchButton} from "../molecules/IconPatchButton";

export function CommentNew() {
  const [disableSend, setDisableSend] = useState(true);

  return (
    <View style={styles.container}>
      <Editor
        placeholder="Write a comment…"
        minHeight={CommentNew.minHeight}
        maxHeight={CommentNew.maxHeight}
        paddingRight={CommentNew.sendButtonWidth}
        onChange={info => setDisableSend(info.isWhitespaceOnly)}
      />
      <View style={styles.send}>
        <IconPatchButton icon="send" disabled={disableSend} />
      </View>
    </View>
  );
}

CommentNew.minHeight = Font.size2.lineHeight + Space.space3 * 2;
CommentNew.maxHeight = Font.size2.lineHeight * 5 + Space.space3 * 2;
CommentNew.sendButtonWidth = IconPatch.size + Space.space3 * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  send: {
    // NOTE: We absolute position the send button so that the scroll indicator
    // on the editor can be all the way at the screen’s edge.
    position: "absolute",
    top: (CommentNew.minHeight - IconPatch.size) / 2,
    right: Space.space3,
  },
});
