import {Color, Font, Space} from "./atoms";
import {Platform, SafeAreaView, StyleSheet, Text, View} from "react-native";
import React from "react";

export function GroupBanner() {
  const title = <Text style={styles.title}>Definitely Work</Text>;

  return Platform.OS === "ios" ? (
    <SafeAreaView style={styles.background}>
      <View style={styles.banner}>{title}</View>
    </SafeAreaView>
  ) : (
    <View style={[styles.background, styles.banner]}>{title}</View>
  );
}

GroupBanner.maxWidth = Space.space14;
GroupBanner.height = Space.space10;

const styles = StyleSheet.create({
  background: {
    overflow: "hidden",
    backgroundColor: Color.yellow3,
  },
  banner: {
    justifyContent: "center",
    width: "100%",
    maxWidth: GroupBanner.maxWidth,
    height: GroupBanner.height,
    paddingHorizontal: Space.space4,
  },
  title: {
    color: Color.yellow9,
    textAlign: "center",
    ...Font.sansBold,
    ...Font.size6,
  },
});
