import {ReactElement, ReactNode} from "react";
import {StyleProp, ViewStyle} from "react-native";

/**
 * Creates a `<div>` on web platforms and a `<View>` on native platforms. Useful
 * for high-performance scenarios on web when you want to avoid the overhead of
 * a `<View>` component.
 *
 * The `createDivElement()` function call on web will directly render a view by
 * monkey-patching into the render method.
 */
export function createDivElement(
  props: {key?: string; style?: StyleProp<ViewStyle>},
  ...children: Array<ReactNode>
): ReactElement;
