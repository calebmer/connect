import React, {useImperativeHandle} from "react";
import {
  View,
  Text,
  TextInput as NativeTextInput,
  TextInputProps as NativeTextInputProps,
  StyleSheet,
} from "react-native";
import {Font, Color, Space, Border} from "./atoms";

interface TextInputProps extends NativeTextInputProps {
  /**
   * The label for our text input.
   */
  readonly label: string;

  /**
   * Available on Web and Android but not iOS.
   */
  readonly autoComplete?: string;
}

function TextInput(
  {label, ...textInputProps}: TextInputProps,
  ref: React.Ref<TextInputInstance>,
) {
  const inputRef = React.createRef<NativeTextInput>();

  // If focus is called on a ref of ours then focus our underlying text input.
  useImperativeHandle(ref, () => ({
    focus: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
  }));

  return (
    <View style={styles.container} accessibilityRole={"label" as any}>
      <Text style={styles.label} selectable={false}>
        {label}
      </Text>
      <NativeTextInput
        {...textInputProps}
        ref={inputRef}
        style={styles.input}
        placeholderTextColor={Color.grey2}
      />
    </View>
  );
}

export type TextInputInstance = {
  readonly focus: () => void;
};

const _TextInput = React.forwardRef(TextInput);
export {_TextInput as TextInput};

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  label: {
    position: "absolute",
    left: Space.space2,
    top: Space.space2,
    color: Color.grey7,
    ...Font.sans,
    ...Font.size1,
    lineHeight: Font.size1.fontSize,
  },
  input: {
    padding: Space.space2,
    paddingTop: Space.space0 + Font.size1.fontSize + Space.space2,
    maxWidth: Space.space14,
    backgroundColor: Color.grey0,
    borderColor: Color.grey1,
    borderWidth: Border.width0,
    borderRadius: Border.radius0,
    color: Color.black,
    ...Font.serif,
    ...Font.size2,
  },
});
