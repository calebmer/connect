import {
  FlexStyle,
  ShadowStyleIOS,
  StyleProp,
  TransformsStyle,
} from "react-native";

export type IconProps = {
  style?: StyleProp<IconStyle>;
  color?: string;
};

export interface IconStyle extends FlexStyle, ShadowStyleIOS, TransformsStyle {
  overflow?: "visible" | "hidden";
}
