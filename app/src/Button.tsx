import {
  Animated,
  StyleSheet,
  TouchableWithoutFeedback,
  ViewProps,
} from "react-native";
import {Border, Color, Font, Space} from "./atoms";
import React, {useEffect, useState} from "react";

export function Button({
  label,
  size = "small",
  disabled,
  onPress,
}: {
  label: string;
  size?: "large" | "small";
  disabled?: boolean;
  onPress: () => void;
}) {
  const [pressed, setPressed] = useState(false);
  const active = pressed;

  return (
    <TouchableWithoutFeedback
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <ButtonAnimated
        label={label}
        size={size}
        theme={disabled ? "disabled" : active ? "primary-active" : "primary"}
      />
    </TouchableWithoutFeedback>
  );
}

interface ButtonAnimatedProps extends ViewProps {
  label: string;
  theme: "primary" | "primary-active" | "disabled";
  size: "large" | "small";
}

function ButtonAnimated({label, theme, size, ...props}: ButtonAnimatedProps) {
  const [animation, setAnimation] = useState(() => ({
    lastTheme: theme,
    theme,
    progress: new Animated.Value(1),
  }));

  useEffect(() => {
    // Always create a new progress value. That way we don’t confuse any
    // animated views which are still mounted that use the old progress state.
    const progress = new Animated.Value(0);

    setAnimation(({theme: lastTheme}) => ({lastTheme, theme, progress}));

    const animation = Animated.spring(progress, {
      toValue: 1,
      tension: 60,
    });

    animation.start();
    return () => {
      animation.stop();
    };
  }, [theme]);

  const buttonColor = animation.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      themeColors[animation.lastTheme].buttonColor,
      themeColors[animation.theme].buttonColor,
    ],
  });

  const textColor = animation.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      themeColors[animation.lastTheme].textColor,
      themeColors[animation.theme].textColor,
    ],
  });

  return (
    <Animated.View
      {...props}
      style={[
        styles.button,
        size === "large" && styles.buttonLarge,
        size === "small" && styles.buttonSmall,
        {backgroundColor: buttonColor},
      ]}
    >
      <Animated.Text
        style={[
          styles.label,
          {color: textColor},
          size === "large" && styles.labelLarge,
          size === "small" && styles.labelSmall,
        ]}
        selectable={false}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
}

const themeColors = {
  primary: {
    buttonColor: Color.yellow3,
    textColor: Color.yellow9,
  },
  "primary-active": {
    buttonColor: Color.yellow5,
    textColor: Color.yellow9,
  },
  disabled: {
    buttonColor: "hsl(0, 0%, 95%)", // `Color.grey0` is too light and `Color.grey1` is too dark
    textColor: Color.grey4,
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
