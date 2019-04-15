import {
  Animated,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} from "react-native";
import {Border, Color, Font, Space} from "./atoms";
import React from "react";
import {useAnimatedValue} from "./useAnimatedValue";

export function Button({
  label,
  theme = "primary",
  size = "small",
  onPress,
}: {
  label: string;
  theme?: "primary";
  size?: "large" | "small";
  onPress: () => void;
}) {
  const pressed = useAnimatedValue(0);
  const backgroundColor = pressed.interpolate({
    inputRange: [0, 1],
    outputRange: [themeColors[theme].color, themeColors[theme].activeColor],
  });
  return (
    <TouchableWithoutFeedback
      accessibilityRole="button"
      onPress={onPress}
      onPressIn={() => Animated.spring(pressed, {toValue: 1}).start()}
      onPressOut={() => Animated.spring(pressed, {toValue: 0}).start()}
    >
      <Animated.View
        style={[
          styles.button,
          size === "large" && styles.buttonLarge,
          size === "small" && styles.buttonSmall,
          {backgroundColor},
        ]}
      >
        <Text
          style={[
            styles.label,
            {color: themeColors[theme].textColor},
            size === "large" && styles.labelLarge,
            size === "small" && styles.labelSmall,
          ]}
          selectable={false}
        >
          {label}
        </Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const themeColors = {
  primary: {
    color: Color.yellow3,
    activeColor: Color.yellow5,
    textColor: Color.yellow9,
  },
};

Button.heightSmall = Space.space5;

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Space.space2,
    backgroundColor: Color.yellow3,
  },
  buttonLarge: {
    height: Space.space6,
    borderRadius: Border.radius2,
  },
  buttonSmall: {
    height: Button.heightSmall,
    borderRadius: Border.radius0,
  },
  label: {
    flex: 1,
    textAlign: "center",
  },
  labelLarge: {
    ...Font.sansBold,
    ...Font.size3,
  },
  labelSmall: {
    ...Font.sans,
    ...Font.size2,
  },
});
