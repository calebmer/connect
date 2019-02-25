import * as React from "react";
import { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import { lineHeight } from "./StyleConstants";

/**
 * Body text is the text forming the main content of our website. It could be
 * user generated content, interface instructions, or marketing copy
 * for example.
 */
export function BodyText({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

/**
 * Used to annotate some part of our interface with important identifying
 * information. For example, a name over a message.
 */
export function LabelText({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

let styles = StyleSheet.create({
  body: {
    color: "#404040",
    fontFamily: "System",
    fontSize: 16,
    fontWeight: "normal",
    lineHeight: lineHeight,
  },
  label: {
    color: "#000000",
    fontFamily: "System",
    fontSize: 14,
    fontWeight: "bold",
    lineHeight: lineHeight,
  },
});
