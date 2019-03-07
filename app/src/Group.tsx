import {StyleSheet, View} from "react-native";
import {GroupBanner} from "./GroupBanner";
import {GroupPostPrompt} from "./GroupPostPrompt";
import React from "react";

export function Group() {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <GroupBanner />
        <GroupPostPrompt />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  card: {
    width: "100%",
    maxWidth: GroupBanner.maxWidth,
  },
});
