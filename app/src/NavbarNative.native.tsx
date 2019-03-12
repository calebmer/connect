import {Animated, SafeAreaView, StyleSheet, View} from "react-native";
import {Color, Shadow, Space} from "./atoms";
import React, {useEffect, useState} from "react";

export function NavbarNative({hideBackground}: {hideBackground?: boolean}) {
  const [backgroundOpacity] = useState(
    new Animated.Value(hideBackground ? 0 : 1),
  );

  useEffect(() => {
    if (hideBackground) {
      Animated.timing(backgroundOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(backgroundOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [backgroundOpacity, hideBackground]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={[styles.background, {opacity: backgroundOpacity}]}
      />
      <View style={styles.navbar} />
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
    ...Shadow.elevation2,
  },
  navbar: {
    height: NavbarNative.height,
  },
});
