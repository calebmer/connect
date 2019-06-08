import {Color, Font, Space} from "../atoms";
import {StyleSheet, Text, View} from "react-native";
import {IconPatch} from "../molecules/IconPatch";
import React from "react";
import {Trough} from "../molecules/Trough";

export function InboxEmpty() {
  // Make this fun with a dancing animation?
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        <Text style={styles.textBold}>You’re all caught up!</Text>
        {"\n"}
        Updates for conversations you participate in will appear here.
      </Text>
      <View style={styles.icon}>
        <IconPatch icon="check" theme="stamp" />
      </View>
    </View>
  );
}

const lineHeight = Font.size2.fontSize * 1.3;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingLeft: Space.space3,
    paddingRight: Space.space4,
    paddingBottom: Space.space4,
    backgroundColor: Trough.backgroundColor,
  },
  text: {
    flex: 1,
    marginRight: Space.space4,
    color: Color.grey7,
    ...Font.serif,
    ...Font.size2,
    lineHeight,
  },
  textBold: {
    color: Color.grey8,
    ...Font.serifBold,
  },
  icon: {
    top: -4,
  },
});
