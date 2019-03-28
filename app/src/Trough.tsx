import {Color, Font, Shadow, Space} from "./atoms";
import React, {ReactNode} from "react";
import {StyleProp, StyleSheet, Text, TextStyle, View} from "react-native";

/**
 * Name comes from a [“trough”][1] that animals drink out of. Also used in
 * various other sciences to refer to the low point in a cycle.
 *
 * [1]: https://en.wiktionary.org/wiki/trough
 */
export function Trough({
  hideTopShadow,
  hideBottomShadow,
  children,
}: {
  hideTopShadow?: boolean;
  hideBottomShadow?: boolean;
  children?: ReactNode;
}) {
  return (
    <View style={styles.trough}>
      {!hideTopShadow && <View style={styles.troughShadowTop} />}
      {!hideBottomShadow && <View style={styles.troughShadowBottom} />}
      {children}
    </View>
  );
}

/**
 * A title in `<Trough>` component.
 */
export function TroughTitle({
  style,
  children,
}: {
  style?: StyleProp<TextStyle>;
  children?: string;
}) {
  return <Text style={[style, styles.troughTitle]}>{children}</Text>;
}

Trough.backgroundColor = Color.grey0;

const styles = StyleSheet.create({
  trough: {
    overflow: "hidden",
    position: "relative",
    minHeight: Space.space3,
    backgroundColor: Trough.backgroundColor,
  },
  troughShadowTop: {
    position: "absolute",
    top: -Space.space3,
    left: 0,
    right: 0,
    height: Space.space3,
    backgroundColor: Color.white,
    ...Shadow.elevation0,
  },
  troughShadowBottom: {
    position: "absolute",
    bottom: -Space.space3,
    left: 0,
    right: 0,
    height: Space.space3,
    backgroundColor: Color.white,
    ...Shadow.elevation0,
  },
  troughTitle: {
    paddingTop: Space.space3,
    paddingBottom: Space.space0 / 2,
    color: Color.grey6,
    ...Font.sans,
    ...Font.size1,
  },
});
