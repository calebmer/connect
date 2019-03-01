import * as React from "react";
import {
  View,
  Text,
  TextInput as NativeTextInput,
  StyleSheet,
} from "react-native";
import {Font, Color, Space, Border} from "./atoms";

export function TextInput({
  label,
  ...textInputProps
}: React.ComponentProps<typeof NativeTextInput> & {
  readonly label: string;
}) {
  return (
    <View style={styles.container} accessibilityRole={"label" as any}>
      <Text style={styles.label}>{label}</Text>
      <NativeTextInput {...textInputProps} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
  },
  label: {
    position: "absolute",
    left: Space.space2,
    top: Space.space2,
    color: Color.grey2,
    ...Font.sans,
    ...Font.size1,
    lineHeight: Font.size1.fontSize,
  },
  input: {
    padding: Space.space2,
    paddingTop: Space.space0 + Font.size1.fontSize + Space.space2,
    maxWidth: Space.space14,
    backgroundColor: Color.grey9,
    borderColor: Color.grey8,
    borderWidth: Border.width0,
    borderRadius: Border.radius0,
    color: Color.black,
    ...Font.serif,
    ...Font.size2,
    lineHeight: Font.size2.fontSize,
  },
});
