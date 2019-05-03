import {Color, Font, Shadow, Space} from "../atoms";
import {Editor, EditorInstance} from "../editor/Editor";
import {Platform, StyleSheet, View} from "react-native";
import React, {useContext, useRef, useState} from "react";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {IconPatch} from "../molecules/IconPatch";
import {IconPatchButton} from "../molecules/IconPatchButton";
import {PostID} from "@connect/api-client";
import {publishComment} from "./CommentCache";
import {useCurrentAccount} from "../account/AccountCache";

function CommentNew({postID}: {postID: PostID}) {
  const currentAccount = useCurrentAccount();

  const isLaptop =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  // A reference to our editor.
  const editor = useRef<EditorInstance>(null);

  // Have we disabled the ability to publish the comment? We disable comment
  // publishing when the editor only has whitespace.
  const [disableSend, setDisableSend] = useState(true);

  function handlePublish() {
    if (editor.current) {
      // Get the current content in the editor.
      const content = editor.current.getContent();

      // Actually publish the comment, hooray! This function will insert into
      // all the right caches. Error handling should be done by the function.
      publishComment({
        authorID: currentAccount.id,
        postID,
        content,
      });

      // Clear the content from our editor but don’t lose focus.
      editor.current.clearContent();
    }
  }

  /**
   * If the user presses “enter” and not “shift+enter” on web then send
   * the message!
   */
  function handleKeyDownWeb(event: React.KeyboardEvent) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!disableSend) {
        handlePublish();
      }
    }
  }

  return (
    <>
      <View style={styles.background} />
      <View style={styles.container}>
        <Editor
          ref={editor}
          placeholder="Send a message…"
          minLines={1}
          maxLines={isLaptop ? 22 : 5}
          paddingRight={IconPatch.size + Space.space3 * 2}
          onChange={info => setDisableSend(info.isWhitespaceOnly)}
          onKeyDownWeb={handleKeyDownWeb}
        />
        <View style={styles.send}>
          <IconPatchButton
            icon="send"
            disabled={disableSend}
            onPress={handlePublish}
          />
        </View>
      </View>
    </>
  );
}

const _CommentNew = React.memo(CommentNew);
export {_CommentNew as CommentNew};

// For the iPhone X bottom area.
const backgroundPaddingBottom = Platform.OS === "ios" ? 50 : 0;

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
  background: {
    position: "absolute",
    top: 0,
    bottom: -backgroundPaddingBottom,
    left: 0,
    right: 0,
    backgroundColor: Color.white,
    ...Shadow.elevation2,
    ...(Platform.OS === "web" && {shadowOffset: {width: 0, height: 2}}),
  },
});
