import {Color, Font, Space} from "../atoms";
import {EditorInstance, EditorProps} from "./EditorShared";
import React, {useCallback, useImperativeHandle, useRef, useState} from "react";
import {StyleSheet, TextInput} from "react-native";

function Editor(
  {
    large,
    placeholder,
    disabled,
    minLines,
    maxLines,
    paddingRight,
    onChange,
  }: EditorProps,
  ref: React.Ref<EditorInstance>,
) {
  // A reference to the editor component itself. We can use this to focus
  // the editor and perform other imperative actions.
  const editor = useRef<TextInput>(null);

  // Current state of the text in our editor component. Whenever this changes
  // the component re-renders.
  const [text, setText] = useState("");

  // A reference to the content. Same as the `text` state except it doesn’t
  // change on every render so we can use it in `useImperativeHandle()`.
  const content = useRef("");

  // Handles changes to our editor’s text content.
  const handleChange = useCallback(
    (newText: string) => {
      // Set both our state and our ref.
      setText(newText);
      content.current = newText;

      // Call our `onChange` callback with updated information.
      if (onChange) {
        onChange({
          isWhitespaceOnly: /^\s*$/.test(newText),
        });
      }
    },
    [onChange],
  );

  // Add instance methods to our component...
  useImperativeHandle(
    ref,
    () => ({
      getContent() {
        return content.current;
      },
      clearContent() {
        handleChange("");
      },
      focus() {
        if (editor.current) {
          editor.current.focus();
        }
      },
    }),
    [handleChange],
  );

  // Get the font size for our editor.
  const fontSize = large ? Font.size3 : Font.size2;

  // The minimum height of our editor is measured based on the font size
  // and `minLines`.
  const minHeight =
    minLines !== undefined
      ? fontSize.lineHeight * minLines + Space.space3 * 2
      : undefined;

  // The maximum height of our editor is measured based on the font size
  // and `maxLines`.
  const maxHeight =
    maxLines !== undefined
      ? fontSize.lineHeight * maxLines + Space.space3 * 2
      : undefined;

  return (
    <TextInput
      ref={editor}
      style={[styles.editor, {...fontSize, minHeight, maxHeight, paddingRight}]}
      onChangeText={handleChange}
      multiline
      placeholder={placeholder}
      placeholderTextColor={Color.grey3}
      editable={!disabled}
      scrollEnabled={maxLines !== undefined}
      // NOTE: We don’t support `autoFocus` in `Editor` because the React Native
      // implementation only triggers focus in `componentDidMount` since it is
      // a class component. Instead we provide a `focus()` method and expect
      // the component rendering an editor to implement auto focusing if they
      // want it.
      autoFocus={false}
    >
      {text}
    </TextInput>
  );
}

const _Editor = React.forwardRef(Editor);
export {_Editor as Editor};

const styles = StyleSheet.create({
  editor: {
    padding: Space.space3,
    paddingTop: Space.space3, // Manually override default `paddingTop` on `<TextInput>`
    textAlignVertical: "top",
    color: Color.grey8,
    ...Font.serif,
  },
});
