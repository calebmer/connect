import {Color, Font, Space} from "./atoms";
import {Platform, SafeAreaView, StyleSheet, Text, View} from "react-native";
import React from "react";

export function GroupBanner({title}: {title: string}) {
  const titleNode = <Text style={styles.title}>{title}</Text>;

  return Platform.OS === "ios" ? (
    <SafeAreaView style={styles.background}>
      <View style={styles.banner}>{titleNode}</View>
    </SafeAreaView>
  ) : (
    <View style={[styles.background, styles.banner]}>{titleNode}</View>
  );
}

GroupBanner.maxWidth = Space.space14;
GroupBanner.height = Space.space11;

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
