import {Border, Color} from "../atoms";
import {Platform, SafeAreaView, StyleSheet, View} from "react-native";
import React from "react";

export function StrokeLayout({children}: {children: React.Node}) {
  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        <View style={styles.bigStroke} />
        <SafeAreaView style={styles.cardContainer}>{children}</SafeAreaView>
      </View>
    );
  }
  return <View style={[styles.container, styles.stroke]}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Color.white,
  },
  cardContainer: {
    flex: 1,
  },
  stroke: {
    borderTopWidth: Border.width4,
    borderTopColor: Color.yellow4,
  },
  bigStroke: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: "80%",
    backgroundColor: Color.yellow4,
  },
});
