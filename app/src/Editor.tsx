import {Color, Font, Space} from "./atoms";
import React, {useState} from "react";
import {StyleSheet, TextInput} from "react-native";

/**
 * A rich text editor for creating or updating text-based content. The editor
 * is consistent across all areas of our application.
 *
 * - Composing posts.
 * - Editing comments.
 * - Sending messages.
 */
export function Editor({autoFocus}: {autoFocus?: boolean}) {
  const [content, setContent] = useState("");

  return (
    <TextInput
      style={styles.input}
      value={content}
      placeholder="test"
      autoFocus={autoFocus}
      multiline
      onChangeText={setContent}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    padding: Space.space3,

    // Override default padding on multiline `<TextInput>`
    // https://github.com/facebook/react-native/blob/742d02a17204c2ada587023b2a81a1960b3947af/Libraries/Components/TextInput/TextInput.js#L1348-L1351
    paddingTop: Space.space3,

    backgroundColor: Color.white,
    textAlignVertical: "top",
    color: Color.grey8,
    ...Font.serif,
    ...Font.size3,
  },
});
