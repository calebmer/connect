import {Color, Font, Shadow, Space} from "./atoms";
import {StyleSheet, Text, View} from "react-native";
import React from "react";

/**
 * Name comes from a [“trough”][1] that animals drink out of. Also used in
 * various other sciences to refer to the low point in a cycle.
 *
 * [1]: https://en.wiktionary.org/wiki/trough
 */
export function Trough({
  title,
  hideTopShadow,
  hideBottomShadow,
  children,
}: {
  title?: string;
  hideTopShadow?: boolean;
  hideBottomShadow?: boolean;
  children?: React.Node;
}) {
  return (
    <View style={styles.trough}>
      {!hideTopShadow && <View style={styles.troughShadowTop} />}
      {!hideBottomShadow && <View style={styles.troughShadowBottom} />}
      {children}
      {title && <Text style={styles.troughTitle}>{title}</Text>}
    </View>
  );
}

Trough.backgroundColor = Color.grey0;

const styles = StyleSheet.create({
  trough: {
    overflow: "hidden",
    position: "relative",
    minHeight: Space.space3,
    paddingHorizontal: Space.space3,
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
