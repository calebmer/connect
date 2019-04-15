import {Animated, StyleSheet, ViewProps} from "react-native";
import {Color, Icon, IconName, Space} from "./atoms";
import React, {useEffect, useState} from "react";

interface IconPatchProps extends ViewProps {
  /**
   * The icon to be rendered in our patch.
   */
  icon: IconName;

  /**
   * The color theme for our patch. If the color theme changes then we will
   * update the theme with an animation.
   */
  theme?: "primary" | "primary-active" | "disabled";
}

/**
 * A way to make an icon more colorful and visually distinct. Puts a dark
 * colored icon on a lightly colored background.
 */
export function IconPatch({icon, theme = "primary", ...props}: IconPatchProps) {
  // The state of the icon’s animation.
  const [animation, setAnimation] = useState(() => ({
    lastTheme: theme,
    theme,
    progress: new Animated.Value(1),
  }));

  // Animate our component to the new theme...
  useEffect(() => {
    // Always create a new progress value. That way we don’t confuse any
    // animated views which are still mounted that use the old progress state.
    const progress = new Animated.Value(0);

    // Update our animation value. Setting the new current theme and moving
    // over the previous theme.
    setAnimation(({theme: lastTheme}) => ({lastTheme, theme, progress}));

    // Animate progress to 1 which will be interpolate to the current
    // theme color.
    const animation = Animated.spring(progress, {toValue: 1});

    animation.start();
    return () => {
      animation.stop();
    };
  }, [theme]);

  const patchColor = animation.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      themeColors[animation.lastTheme].patchColor,
      themeColors[animation.theme].patchColor,
    ],
  });

  const iconColor = animation.progress.interpolate({
    inputRange: [0, 1],
    outputRange: [
      themeColors[animation.lastTheme].iconColor,
      themeColors[animation.theme].iconColor,
    ],
  });

  return (
    <Animated.View
      {...props}
      style={[styles.container, {backgroundColor: patchColor}]}
    >
      <Icon
        style={[
          icon === "edit" && styles.iconEdit,
          icon === "send" && styles.iconSend,
        ]}
        name={icon}
        color={iconColor}
      />
    </Animated.View>
  );
}

const themeColors = {
  primary: {
    patchColor: Color.yellow1,
    iconColor: Color.yellow8,
  },
  "primary-active": {
    patchColor: Color.yellow3,
    iconColor: Color.yellow8,
  },
  disabled: {
    patchColor: "hsl(0, 0%, 95%)", // `Color.grey0` is too light and `Color.grey1` is too dark
    iconColor: Color.grey4,
  },
};

IconPatch.size = Space.space5;

const styles = StyleSheet.create({
  container: {
    width: IconPatch.size,
    height: IconPatch.size,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: IconPatch.size / 2,
  },
  iconEdit: {
    position: "relative",
    top: -0.7,
    right: -0.7,
  },
  iconSend: {
    position: "relative",
    top: 0.5,
    right: 0.5,
  },
});
