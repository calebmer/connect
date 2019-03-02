import * as React from "react";
import {TouchableWithoutFeedback, View, Text, StyleSheet} from "react-native";
import * as Color from "./Color";
import * as Font from "./Font";
import * as Space from "./Space";
import * as Border from "./Border";

export function Button({
  label,
  onPress,
}: {
  readonly label: string;
  readonly onPress: () => void;
}) {
  return (
    <TouchableWithoutFeedback accessibilityRole="button" onPress={onPress}>
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
    justifyContent: "center",
    height: Space.space6,
    paddingHorizontal: Space.space6,
    backgroundColor: Color.yellow3,
    borderRadius: Border.radius2,
    borderColor: Color.yellow5,
  },
  label: {
    color: Color.yellow9,
    textAlign: "center",
    ...Font.sansBold,
    ...Font.size3,
  },
});
