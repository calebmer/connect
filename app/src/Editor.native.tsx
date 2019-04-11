import {Color, Font, Space} from "./atoms";
import {StyleSheet, TextInput} from "react-native";
import {EditorProps} from "./EditorProps";
import React from "react";

export function Editor({
  content,
  placeholder,
  autoFocus,
  onChange,
}: EditorProps) {
  return (
    <TextInput
      style={styles.editor}
      multiline
      value={content}
      placeholder={placeholder}
      placeholderTextColor={Color.grey3}
      onChangeText={onChange}
      autoFocus={autoFocus}
      scrollEnabled={false}
    />
  );
}

const styles = StyleSheet.create({
  editor: {
    padding: Space.space3,
    paddingTop: Space.space3, // Manually override default `paddingTop` on `<TextInput>`
    textAlignVertical: "top",
    color: Color.grey8,
    ...Font.serif,
    ...Font.size3,
  },
});
