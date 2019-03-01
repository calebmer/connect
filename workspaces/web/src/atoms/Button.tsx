import * as React from "react";
import {TouchableWithoutFeedback, View, Text, StyleSheet} from "react-native";
import * as Color from "./Color";
import * as Font from "./Font";
import * as Space from "./Space";

export function Button({label}: {readonly label: string}) {
  return (
    <TouchableWithoutFeedback accessibilityRole="button">
      <View style={styles.button}>
        <Text style={styles.label} selectable={false}>
          {label}
        </Text>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: Space.space2,
    paddingHorizontal: Space.space6,
    backgroundColor: Color.yellow3,
    borderRadius: Space.space3 * 2,
  },
  label: {
    color: Color.yellow9,
    ...Font.sansBold,
    ...Font.size3,
  },
});
