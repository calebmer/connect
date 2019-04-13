import {Color, Font, Space} from "./atoms";
import {EditorInstance, EditorProps} from "./EditorShared";
import React, {useImperativeHandle, useRef} from "react";
import {StyleSheet, TextInput} from "react-native";

function Editor(
  {minHeight, placeholder, disabled}: EditorProps,
  ref: React.Ref<EditorInstance>,
) {
  const editor = useRef<TextInput>(null);

  // Add instance methods to our component...
  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        if (editor.current) {
          editor.current.focus();
        }
      },
    }),
    [],
  );

  return (
    <TextInput
      ref={editor}
      style={[styles.editor, {minHeight}]}
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
