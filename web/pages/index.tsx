import * as React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function IndexPage() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello Next.js 👋</Text>
    </View>
  );
}

let styles = StyleSheet.create({
  container: {
    alignItems: "center",
    flexGrow: 1,
    justifyContent: "center",
  },
  text: {
    alignItems: "center",
    fontSize: 24,
  },
});
