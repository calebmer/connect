import {Color, Font, Space} from "./atoms";
import {Platform, SafeAreaView, StyleSheet, Text, View} from "react-native";
import {Group} from "@connect/api-client";
import React from "react";

export function GroupBanner({group}: {group: Group}) {
  const titleNode = (
    <Text
      accessibilityRole={Platform.OS === "web" ? ("heading" as any) : undefined}
      style={styles.title}
    >
      {group.name}
    </Text>
  );

  return Platform.OS === "ios" ? (
    <SafeAreaView style={styles.background}>
      <View style={styles.banner}>{titleNode}</View>
    </SafeAreaView>
  ) : (
    <View
      accessibilityRole={Platform.OS === "web" ? ("banner" as any) : "header"}
      style={[styles.background, styles.banner]}
    >
      {titleNode}
    </View>
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
    ...Font.size5,
  },
});
