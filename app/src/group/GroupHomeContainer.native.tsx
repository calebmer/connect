/**
 * Pretty normal. See `./GroupHomeContainer.web.tsx` for the reason why we split
 * this component into platform files.
 */

import {StyleSheet, View} from "react-native";
import React from "react";

export function GroupHomeContainer({children}: {children: React.Node}) {
  return <View style={styles.container}>{children}</View>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
});
