import {
  FlexStyle,
  ShadowStyleIOS,
  StyleProp,
  TransformsStyle,
} from "react-native";
import React from "react";

export type IconProps = {
  style?: StyleProp<IconStyle>;
  color?: string;
};

export interface IconStyle extends FlexStyle, ShadowStyleIOS, TransformsStyle {
  overflow?: "visible" | "hidden";
}

export type IconComponent = React.ComponentType<IconProps>;
