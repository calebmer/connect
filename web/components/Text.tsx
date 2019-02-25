import * as React from "react";
import { StyleSheet, Text } from "react-native";

let bodyFontFamily = "System";
let bodyFontSize = 16;
export let bodyLineHeight = 20;
let bodyColor = "#333333";

/**
 * Themed body text.
 */
export function BodyText({ children }: { children: React.ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

let styles = StyleSheet.create({
  body: {
    fontFamily: bodyFontFamily,
    fontSize: bodyFontSize,
    lineHeight: bodyLineHeight,
    color: bodyColor,
  },
});
