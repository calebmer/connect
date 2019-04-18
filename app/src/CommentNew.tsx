import {Color, Font, Shadow, Space} from "./atoms";
import {StyleProp, StyleSheet, View, ViewStyle} from "react-native";
import {Editor} from "./Editor";
import React from "react";

export function CommentNew({
  style,
  disabled,
}: {
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
}) {
  return (
    <View style={[style, styles.container]}>
      <Editor placeholder="Write a comment…" disabled={disabled} />
    </View>
  );
}

CommentNew.minHeight = Font.size3.lineHeight + Space.space3 * 2;

const styles = StyleSheet.create({
  container: {
    backgroundColor: Color.white,
    ...Shadow.elevation2,
  },
});
