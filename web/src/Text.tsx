import * as React from "react";
import { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import { lineHeight } from "./StyleConstants";

export function BodyText({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

export function LabelText({ children }: { children: ReactNode }) {
  return <Text style={styles.label}>{children}</Text>;
}

let styles = StyleSheet.create({
  body: {
    color: "#333333",
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
