import {StyleSheet, View} from "react-native";
import {GroupBanner} from "./GroupBanner";
import React from "react";

export function Group() {
  return (
    <View style={styles.container}>
      <GroupBanner />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
});
