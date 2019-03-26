import * as Color from "./Color";
import * as Space from "./Space";
import {Platform, StyleSheet, Text} from "react-native";
import {GlyphMap} from "../assets/icons/GlyphMap";
import React from "react";

/**
 * The name of an available icon for our application.
 */
export type IconName = keyof typeof GlyphMap;

/**
 * An icon in our application. We use Font Awesome for our icon set since it
 * is _very_ flexible.
 */
export function Icon({
  name,
  size = Space.space3,
  color = Color.grey7,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return (
    <Text
      style={[styles.icon, {color, fontSize: size, lineHeight: size}]}
      selectable={false}
    >
      {String.fromCharCode(GlyphMap[name])}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontFamily:
      Platform.OS === "web" ? '"Font Awesome 5 Free"' : "Font Awesome 5 Free",
    ...(Platform.OS === "web" && {
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    }),
  },
});
