import {Color, Font, Space} from "./atoms";
import {StyleSheet, TextInput} from "react-native";
import {EditorProps} from "./EditorProps";
import React from "react";

export function Editor({placeholder, autoFocus}: EditorProps) {
  return (
    <TextInput
      style={styles.editor}
      multiline
      placeholder={placeholder}
      placeholderTextColor={Color.grey3}
      autoFocus={autoFocus}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  editor: {
    flex: 1,
    padding: Space.space3,
    paddingTop: Space.space3, // Manually override default `paddingTop` on `<TextInput>`
    textAlignVertical: "top",
    color: Color.grey8,
    ...Font.serif,
    ...Font.size3,
  },
});
