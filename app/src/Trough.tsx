import {Color, Font, Shadow, Space} from "./atoms";
import {StyleSheet, Text, View} from "react-native";
import React from "react";

/**
 * Name comes from a [“trough”][1] that animals drink out of. Also used in
 * various other sciences to refer to the low point in a cycle.
 *
 * [1]: https://en.wiktionary.org/wiki/trough
 */
export function Trough({title}: {title?: string}) {
  return (
    <View style={styles.trough}>
      <View style={styles.troughShadowTop} />
      <View style={styles.troughShadowBottom} />
      {title && <Text style={styles.title}>{title}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  trough: {
    overflow: "hidden",
    position: "relative",
    height: Font.size1.lineHeight + Space.space0 / 2 + Space.space3,
    backgroundColor: Color.grey0,
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
  title: {
    position: "absolute",
    bottom: 0,
    paddingHorizontal: Space.space3,
    paddingBottom: Space.space0 / 2,
    color: Color.grey6,
    ...Font.sans,
    ...Font.size1,
  },
});

// function GroupSectionSeparator({
//   isLeading,
//   isTrailing,
// }: {
//   isLeading?: boolean;
//   isTrailing?: boolean;
// }) {
//   return (
//     <View style={styles.sectionSeparator}>
//       {isLeading && <View style={styles.sectionSeparatorShadowLeading} />}
//       {isTrailing && <View style={styles.sectionSeparatorShadowTrailing} />}
//     </View>
//   );
// }
