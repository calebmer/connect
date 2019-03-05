import * as Border from "./Border";
import * as Color from "./Color";
import * as Font from "./Font";
import * as Space from "./Space";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} from "react-native";
import React, {useState} from "react";

export function Button({
  label,
  onPress,
}: {
  readonly label: string;
  readonly onPress: () => void;
}) {
  const [pressed] = useState(new Animated.Value(0));
  const backgroundColor = pressed.interpolate({
    inputRange: [0, 1],
    outputRange: [Color.yellow3, Color.yellow5],
  });
  return (
    <TouchableWithoutFeedback
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => Animated.spring(pressed, {toValue: 1}).start()}
      onPressOut={() => Animated.spring(pressed, {toValue: 0}).start()}
    >
      <Animated.View style={[styles.button, {backgroundColor}]}>
        <Text style={styles.label} selectable={false}>
          {label}
        </Text>
      </Animated.View>
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
  },
  label: {
    color: Color.yellow9,
    textAlign: "center",
    ...Font.sansBold,
    ...Font.size3,
  },
});
