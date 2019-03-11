import React, {SVGProps} from "react";
import {IconProps} from "./IconTypes";
import {Platform} from "react-native";

// @ts-ignore
import {createElement} from "react-native-web";

export function createIconComponent({
  default: Component,
}: {
  readonly default: React.ComponentType<SVGProps<SVGSVGElement>>;
}) {
  if (Platform.OS !== "web") {
    throw new Error(
      "SVG icons can only be used on the web please use Icon.native.tsx everywhere else.",
    );
  }

  return function Icon({style, color}: IconProps) {
    return createElement(Component, {
      style: [style, {fill: color}],
    });
  };
}
