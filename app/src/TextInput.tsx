import React, {useImperativeHandle, useRef} from "react";
import {
  View,
  Text,
  TextInput as NativeTextInput,
  TextInputProps as NativeTextInputProps,
  StyleSheet,
  Platform,
  Image,
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
    <View
      style={styles.container}
      accessibilityRole={
        // On web, we can select the input through the label because of the
        // native behavior of a `<label>` element.
        Platform.OS === "web" ? ("label" as any) : undefined
      }
    >
      <NativeTextInput
        {...textInputProps}
        ref={inputRef}
        style={styles.input}
        placeholderTextColor={Color.grey2}
      />
      <Text
        style={styles.label}
        selectable={false}
        onPress={
          // On other platforms we can select the input through the label by
          // adding a press handler.
          Platform.OS !== "web"
            ? () => inputRef.current && inputRef.current.focus()
            : undefined
        }
      >
        {label}
      </Text>
      {errorMessage && (
        <View style={styles.error}>
          <Image
            style={styles.errorIcon}
            source={require("./assets/icons/x-sm.png")}
          />
          <Text style={styles.errorText}>{errorMessage}</Text>
        </View>
      )}
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
    borderWidth: Border.width1,
    borderRadius: Border.radius0,
    color: Color.black,
    ...Font.serif,
    ...Font.size2,
    lineHeight: undefined,
  },
  error: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Space.space1,
    paddingHorizontal: Space.space0,
  },
  errorIcon: {
    width: Space.space1,
    height: Space.space1,
  },
  errorText: {
    paddingLeft: Space.space0,
    color: Color.red6,
    ...Font.sans,
    ...Font.size2,
    lineHeight: undefined,
  },
});
