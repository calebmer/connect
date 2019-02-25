import * as React from "react";
import { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import * as StyleConstants from "./StyleConstants";

/**
 * Themed body text.
 */
export function BodyText({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

let styles = StyleSheet.create({
  body: {
    fontFamily: StyleConstants.bodyFontFamily,
    fontSize: StyleConstants.bodyFontSize,
    lineHeight: StyleConstants.bodyLineHeight,
    color: StyleConstants.bodyTextColor,
  },
});
