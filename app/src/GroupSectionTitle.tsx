import {Color, Font, Space} from "./atoms";
import {StyleSheet, Text, View} from "react-native";
import {ChevronRightIcon} from "./icons/ChevronRightIcon";
import React from "react";

export function GroupSectionTitle({
  title,
  link,
}: {
  title: string;
  link?: string;
}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {link && (
        <View style={styles.link}>
          <Text style={styles.linkText}>{link}</Text>
          <ChevronRightIcon style={styles.linkIcon} color={Color.grey5} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: Space.space4,
    paddingHorizontal: Space.space3,
  },
  title: {
    color: Color.grey7,
    ...Font.sansBold,
    ...Font.size3,
  },
  link: {
    position: "relative",
    bottom: -((Font.size3.fontSize - Font.size1.fontSize) / 2), // align to text baseline
    flexDirection: "row",
    alignItems: "center",
  },
  linkText: {
    color: Color.grey6,
    ...Font.sans,
    ...Font.size1,
  },
  linkIcon: {
    marginLeft: Space.space0,
    height: Space.space2,
    width: Space.space2,
  },
});
