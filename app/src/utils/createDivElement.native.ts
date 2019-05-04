import React, {ReactElement, ReactNode} from "react";
import {StyleProp, View, ViewStyle} from "react-native";

export function createDivElement(
  props: {key?: string; style?: StyleProp<ViewStyle>},
  ...children: Array<ReactNode>
): ReactElement {
  return React.createElement(View, props, ...children);
}
