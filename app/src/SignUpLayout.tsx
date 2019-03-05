import {Border, Color, Space} from "./atoms";
import {Platform, SafeAreaView, StyleSheet, View} from "react-native";
import React, {ReactNode} from "react";

export function SignUpLayout({children}: {children: ReactNode}) {
  if (Platform.OS === "ios") {
    return (
      <View style={styles.container}>
        <View style={styles.bigStroke} />
        <SafeAreaView style={styles.cardContainer}>
          <View style={styles.card}>{children}</View>
        </SafeAreaView>
      </View>
    );
  }
  return (
    <View style={[styles.container, styles.stroke]}>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Color.white,
  },
  card: {
    padding: Space.space4,
    paddingTop: Space.space7,
    width: "100%",
    maxWidth: Space.space14,
    backgroundColor: Color.white,
  },
  cardContainer: {
    flex: 1,
    width: "100%",
    maxWidth: Space.space14,
  },
  stroke: {
    borderTopWidth: Border.width3,
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
