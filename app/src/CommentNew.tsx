import {Color, Shadow} from "./atoms";
import {StyleSheet, View} from "react-native";
import {Editor} from "./Editor";
import React from "react";

export function CommentNew({disabled}: {disabled?: boolean}) {
  return (
    <View style={styles.container}>
      <Editor placeholder="Write a comment…" disabled={disabled} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Color.white,
    ...Shadow.elevation2,
  },
});
