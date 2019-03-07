import {IconProps} from "./IconTypes";
import {Platform} from "react-native";
import {ReactElement} from "react";

// @ts-ignore
import {createElement} from "react-native-web";

export function createIconComponent(source: ReactElement<any, "svg">) {
  if (Platform.OS !== "web") {
    throw new Error(
      "SVG icons can only be used on the web please use Icon.native.tsx everywhere else.",
    );
  }

  return function Icon({style, color}: IconProps) {
    return createElement("svg", {
      ...source.props,
      style: [style, {fill: color}],
    });
  };
}
