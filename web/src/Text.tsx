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
 * Label text is used to annotate some part of our interface with important
 * identifying information. For example, the name over a message. The text is
 * bold which makes it stick out compared to `<BodyText>`.
 *
 * May never be more than one line long.
 */
export function LabelText({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.label} numberOfLines={1}>
      {children}
    </Text>
  );
}

/**
 * Lite text is some auxillary information which is only sometimes important.
 * For example, the date a message was sent. The font size is smaller which
 * hides the text compared to `<BodyText>`.
 *
 * May never be more than one line long.
 */
export function LiteText({ children }: { children: ReactNode }) {
  return (
    <Text style={styles.lite} numberOfLines={1}>
      {children}
    </Text>
  );
}

let bodyFontSize = 16;
let liteFontSize = 12;

let styles = StyleSheet.create({
  body: {
    color: "#404040",
    fontFamily: "System",
    fontSize: bodyFontSize,
    fontWeight: "normal",
    lineHeight: lineHeight,
  },
  label: {
    color: "#000000",
    fontFamily: "System",
    fontSize: bodyFontSize,
    fontWeight: "bold",
    lineHeight: lineHeight,
  },
  lite: {
    color: "#808080",
    fontFamily: "System",
    fontSize: liteFontSize,
    fontWeight: "normal",
    lineHeight: lineHeight,

    // We want the same baseline as our `bodyFontSize` friends. Ok since lite
    // text will only ever be one line long.
    position: "relative",
    bottom: -((bodyFontSize - liteFontSize) / 2) + 0.5,
  },
});
