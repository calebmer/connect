import {Color, Font, Space} from "./atoms";
import {Platform, SafeAreaView, StyleSheet, Text, View} from "react-native";
import React from "react";

export function GroupBanner() {
  const title = <Text style={styles.title}>Definitely Work</Text>;

  return Platform.OS === "ios" ? (
    <View style={styles.banner}>
      <SafeAreaView style={styles.center}>{title}</SafeAreaView>
    </View>
  ) : (
    <View style={[styles.banner, styles.center]}>{title}</View>
  );
}

GroupBanner.height = Space.space10;

const styles = StyleSheet.create({
  banner: {
    overflow: "hidden",
    maxWidth: Space.space15,
    width: "100%",
    height: GroupBanner.height,
    paddingHorizontal: Space.space4,
    backgroundColor: Color.yellow3,
  },
  center: {
    flex: 1,
    justifyContent: "center",
  },
  title: {
    color: Color.yellow9,
    textAlign: "center",
    ...Font.sansBold,
    ...Font.size6,
  },
});
