import * as React from "react";
import { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import { lineHeight } from "./StyleConstants";

/**
 * Body text is the text forming the main content of our website. It could be
 * user generated content, interface instructions, or marketing copy
 * for example.
 *
 * Body text also has a maximum width. Beyond that width the text loses
 * legibility.
 *
 * We use a serif font for body text which goes a bit against the modern
 * sans-serif style in tech. Some would argue that serif fonts are better for
 * legibility when reading long blocks of text. This is a contributing factor
 * to why we picked a serif font. Mostly, we want to define a unique visual
 * style for our product. One that distinguishes us from products like Slack
 * and Facebook. The easiest place to start is with the font.
 */
export function BodyText({ children }: { children: ReactNode }) {
  return <Text style={styles.body}>{children}</Text>;
}

let bodyFontSize = 16;

/**
 * We want to fit about 50–60 characters per line of text.
 */
BodyText.maxWidth = bodyFontSize * 30;

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

let liteFontSize = 12;

let styles = StyleSheet.create({
  body: {
    maxWidth: BodyText.maxWidth,
    color: "#333333",
    fontFamily: "'Lora', System",
    fontSize: bodyFontSize,
    fontWeight: "normal",
    lineHeight: lineHeight,

    // `lineHeight` puts our text in the middle of the line, however we want our
    // text to be base-aligned. Add some re-positioning to accomplish this.
    position: "relative",
    bottom: -((lineHeight - bodyFontSize) / 2) - 2,

    // Better OSX font rendering.
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  },
  label: {
    color: "#000000",
    fontFamily: "'Lora', System",
    fontSize: bodyFontSize,
    fontWeight: "bold",
    lineHeight: lineHeight,

    // `lineHeight` puts our text in the middle of the line, however we want our
    // text to be base-aligned. Add some re-positioning to accomplish this.
    position: "relative",
    bottom: -((lineHeight - bodyFontSize) / 2) - 2,

    // Better OSX font rendering.
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  },
  lite: {
    color: "#8C8C8C",
    fontFamily: "System",
    fontSize: liteFontSize,
    fontWeight: "normal",
    lineHeight: lineHeight,

    // `lineHeight` puts our text in the middle of the line, however we want our
    // text to be base-aligned. Add some re-positioning to accomplish this.
    position: "relative",
    bottom: -((lineHeight - liteFontSize) / 2) - 1.5,

    // Better OSX font rendering.
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
  },
});