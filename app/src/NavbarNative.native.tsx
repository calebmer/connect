import {Animated, SafeAreaView, StyleSheet, View} from "react-native";
import {Color, Font, Shadow, Space} from "./atoms";
import React, {useEffect, useState} from "react";

export function NavbarNative({
  title,
  hideBackground,
  hideTitleWithBackground,
}: {
  title?: string;
  hideBackground?: boolean;
  hideTitleWithBackground?: boolean;
}) {
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
