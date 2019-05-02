import {Border, Color, Font, Icon, Space} from "../atoms";
import {StyleSheet, Text, View} from "react-native";
import React from "react";

export function CommentNewJumpButton() {
  return (
    <View style={styles.container}>
      <View style={styles.button}>
        <Icon
          name="arrow-down"
          color={Color.yellow8}
          size={Font.size1.fontSize}
        />
        <Text style={styles.label}>latest</Text>
      </View>
    </View>
  );
}

const height = Font.size1.lineHeight + Space.space0;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: -(height + Space.space2),
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Space.space2,
    paddingVertical: Space.space0 / 2,
    borderRadius: Border.radius2,
    backgroundColor: Color.yellow2,
  },
  label: {
    marginLeft: Space.space0,
    color: Color.yellow8,
    ...Font.sans,
    ...Font.size1,
  },
});
