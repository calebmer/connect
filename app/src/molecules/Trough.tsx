import {Color, Font, Icon, IconName, Shadow, Space} from "../atoms";
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
  icon,
  hideTopShadow,
  hideBottomShadow,
  paddingHorizontal,
  children,
}: {
  title?: string;
  icon?: IconName;
  hideTopShadow?: boolean;
  hideBottomShadow?: boolean;
  paddingHorizontal?: number;
  children?: React.Node;
}) {
  return (
    <View
      style={
        paddingHorizontal ? [styles.trough, {paddingHorizontal}] : styles.trough
      }
    >
      {hideTopShadow !== true && <View style={styles.troughShadowTop} />}
      {hideBottomShadow !== true && <View style={styles.troughShadowBottom} />}
      {children}
      {title !== undefined && (
        <Text style={styles.troughTitle}>
          {icon && (
            <Icon style={styles.troughIcon} name={icon} size={Space.space2} />
          )}
          {title}
        </Text>
      )}
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
  troughIcon: {
    marginRight: 7,
  },
});
