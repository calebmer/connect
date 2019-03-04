import React, {useImperativeHandle, useRef} from "react";
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
   * When there’s some error in the input we display the error message
   * beneath the input.
   */
  readonly errorMessage?: string;

  /**
   * Available on Web and Android but not iOS.
   */
  readonly autoComplete?: string;
}

function TextInput(
  {label, errorMessage, ...textInputProps}: TextInputProps,
  ref: React.Ref<TextInputInstance>,
) {
  const inputRef = useRef<NativeTextInput | null>(null);

  // If focus is called on a ref of ours then focus our underlying text input.
  useImperativeHandle(
    ref,
    () => ({
      focus: () => {
        if (inputRef.current) {
          inputRef.current.focus();
        }
      },
    }),
    [],
  );

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
      {errorMessage && (
        <View style={styles.error}>
          <ErrorIcon />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
    </View>
  );
}

function ErrorIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      width={Space.space1}
      height={Space.space1}
      fill={Color.red5}
      viewBox="0 0 16 16"
    >
      <path d="M3 .156l-2.844 2.844 1.438 1.406 3.594 3.594-3.594 3.594-1.438 1.406 2.844 2.844 1.406-1.438 3.594-3.594 3.594 3.594 1.406 1.438 2.844-2.844-1.438-1.406-3.594-3.594 3.594-3.594 1.438-1.406-2.844-2.844-1.406 1.438-3.594 3.594-3.594-3.594-1.406-1.438z" />
    </svg>
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
  error: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Space.space0,
    paddingLeft: Space.space0,
  },
  errorText: {
    paddingLeft: Space.space0,
    color: Color.red6,
    ...Font.sans,
    ...Font.size2,
    lineHeight: Font.size2.fontSize,
  },
});
