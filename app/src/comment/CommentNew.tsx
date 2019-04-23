import {Font, Space} from "../atoms";
import React, {useContext, useState} from "react";
import {StyleSheet, View} from "react-native";
import {Editor} from "../editor/Editor";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {IconPatch} from "../molecules/IconPatch";
import {IconPatchButton} from "../molecules/IconPatchButton";

export function CommentNew() {
  const isLaptop =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  const [disableSend, setDisableSend] = useState(true);

  return (
    <View style={styles.container}>
      <Editor
        placeholder="Send a message…"
        minLines={1}
        maxLines={isLaptop ? 22 : 5}
        paddingRight={IconPatch.size + Space.space3 * 2}
        onChange={info => setDisableSend(info.isWhitespaceOnly)}
      />
      <View style={styles.send}>
        <IconPatchButton icon="send" disabled={disableSend} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  send: {
    // NOTE: We absolute position the send button so that the scroll indicator
    // on the editor can be all the way at the screen’s edge.
    position: "absolute",
    top: Space.space3 + Font.size2.lineHeight / 2 - IconPatch.size / 2,
    right: Space.space3,
  },
});
