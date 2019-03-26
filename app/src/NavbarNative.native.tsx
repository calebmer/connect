import {Animated, SafeAreaView, StyleSheet, View} from "react-native";
import {Color, Font, IconName, Shadow, Space} from "./atoms";
import React, {useEffect, useState} from "react";

type NavbarNativeProps = {
  /**
   * The navbar title. Will be displayed in the center of the navbar. Use this
   * to provide context about the current visible screen.
   */
  title?: string;

  /**
   * The icon to be displayed on the left side of the navbar.
   */
  leftIcon?: IconName;

  /**
   * Should the background of our navbar be hidden to let the content
   * underneath show? We will animate the background into place when this
   * prop changes.
   */
  hideBackground?: boolean;

  /**
   * If `hideBackground` is true should we also hide the title? When
   * `hideBackground` changes to false we will animate the title alongside
   * the background.
   */
  hideTitleWithBackground?: boolean;
};

export function NavbarNative({
  title,
  leftIcon,
  hideBackground,
  hideTitleWithBackground,
}: NavbarNativeProps) {
  const [backgroundOpacity] = useState(
    new Animated.Value(hideBackground ? 0 : 1),
  );

  const titleOpacity = hideTitleWithBackground ? backgroundOpacity : undefined;

  useEffect(() => {
    if (hideBackground) {
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [backgroundOpacity, hideBackground]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[styles.background, {opacity: backgroundOpacity}]}
      />
      <View style={styles.navbar}>
        {title && (
          <Animated.Text
            style={[styles.title, {opacity: titleOpacity}]}
            numberOfLines={1}
          >
            {title}
          </Animated.Text>
        )}
      </View>
    </SafeAreaView>
  );
}

NavbarNative.height = Space.space6;

const styles = StyleSheet.create({
  container: {
    zIndex: 200,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  background: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Color.white,
    ...Shadow.elevation1,
  },
  navbar: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: NavbarNative.height,
  },
  title: {
    color: Color.grey6,
    textAlign: "center",
    ...Font.sans,
    ...Font.size2,
  },
});
