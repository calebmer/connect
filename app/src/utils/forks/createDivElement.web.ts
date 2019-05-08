import {ReactElement, ReactNode} from "react";
import {StyleProp, StyleSheet, ViewStyle} from "react-native";
import {createElement} from "react-native-web";

export function createDivElement(
  {key, style}: {key?: string; style?: StyleProp<ViewStyle>},
  ...children: Array<ReactNode>
): ReactElement {
  return createElement("div", {key, style: [styles.view, style]}, ...children);
}

const styles = StyleSheet.create({
  view: {
    boxSizing: "border-box",
    display: "flex",
    flexDirection: "column",
  },
});
