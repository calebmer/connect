import * as Color from "./Color";
import * as Space from "./Space";
import {Platform, StyleProp, StyleSheet, Text, TextStyle} from "react-native";
import {GlyphMap} from "../assets/icons/GlyphMap";
import React from "react";

/**
 * The name of an available icon for our application.
 */
export type IconName = keyof typeof GlyphMap;

/**
 * An icon in our application.
 */
export function Icon({
  name,
  size = Space.space3,
  color = Color.grey7,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return (
    <Text
      style={[style, styles.icon, {color, fontSize: size, lineHeight: size}]}
      selectable={false}
    >
      {String.fromCharCode(GlyphMap[name])}
    </Text>
  );
}

const styles = StyleSheet.create({
  icon: {
    fontFamily: "Feather",
    ...(Platform.OS === "web" && {
      WebkitFontSmoothing: "antialiased",
      MozOsxFontSmoothing: "grayscale",
    }),
  },
});
