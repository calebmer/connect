import {Image, ImageSourcePropType, Platform} from "react-native";
import {IconProps} from "./IconTypes";
import React from "react";

export function createIconComponent(source: ImageSourcePropType) {
  if (Platform.OS === "web") {
    throw new Error(
      "Please use SVG icons with Icon.web.tsx for icons on the web.",
    );
  }

  return function Icon({style, color}: IconProps) {
    // NOTE: `tintColor` is complicated to implement on the web.
    return <Image source={source} style={[style, {tintColor: color}]} />;
  };
}
