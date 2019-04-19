import {Color, Font, Space} from "../atoms";
import {EditorInstance, EditorProps} from "./EditorShared";
import React, {useImperativeHandle, useRef, useState} from "react";
import {StyleSheet, TextInput} from "react-native";

function Editor(
  {minHeight, placeholder, disabled, onChange}: EditorProps,
  ref: React.Ref<EditorInstance>,
) {
  // A reference to the editor component itself. We can use this to focus
  // the editor and perform other imperative actions.
  const editor = useRef<TextInput>(null);

  // Add instance methods to our component...
  useImperativeHandle(
    ref,
    () => ({
      getContent() {
        return content.current;
      },
      focus() {
        if (editor.current) {
          editor.current.focus();
        }
      },
    }),
    [],
  );

  // Current state of the text in our editor component. Whenever this changes
  // the component re-renders.
  const [text, setText] = useState("");

  // A reference to the content. Same as the `text` state except it doesn’t
  // change on every render so we can use it in `useImperativeHandle()`.
  const content = useRef("");

  function handleChangeText(newText: string) {
    // Set both our state and our ref.
    setText(newText);
    content.current = newText;

    if (onChange) {
      onChange({
        isWhitespaceOnly: /^\s*$/.test(newText),
      });
    }
  }

  return (
    <TextInput
      ref={editor}
      style={[styles.editor, {minHeight}]}
      value={text}
      onChangeText={handleChangeText}
      multiline
      placeholder={placeholder}
      placeholderTextColor={Color.grey3}
      editable={!disabled}
      scrollEnabled={false}
      // NOTE: We don’t support `autoFocus` in `Editor` because the React Native
      // implementation only triggers focus in `componentDidMount` since it is
      // a class component. Instead we provide a `focus()` method and expect
      // the component rendering an editor to implement auto focusing if they
      // want it.
      autoFocus={false}
    />
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
    ...Font.size3,
  },
});
