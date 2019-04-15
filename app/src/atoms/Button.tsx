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
import {Icon, IconName} from "./Icon";
import React from "react";
import {useConstant} from "../useConstant";

export function Button({
  label,
  icon,
  theme = "primary",
  size = "small",
  onPress,
}: {
  label: string;
  icon?: IconName;
  theme?: "primary";
  size?: "large" | "small";
  onPress: () => void;
}) {
  const pressed = useConstant(() => new Animated.Value(0));
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
        {icon && (
          <Icon
            style={styles.icon}
            name={icon}
            color={themeColors[theme].iconColor}
          />
        )}
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

const themeColors = {
  primary: {
    color: Color.yellow3,
    activeColor: Color.yellow5,
    textColor: Color.yellow9,
    iconColor: Color.yellow8,
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
  icon: {
    paddingLeft: Space.space0,
  },
});
