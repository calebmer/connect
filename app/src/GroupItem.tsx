import {Border, Color, Space} from "./atoms";
import React, {ReactNode, useState} from "react";
import {StyleSheet, TouchableWithoutFeedback, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";

export function GroupItem({
  account,
  children,
}: {
  account: AccountProfile;
  children: ReactNode;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableWithoutFeedback
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <View style={[styles.container, isPressed && styles.containerPressed]}>
        <AccountAvatar account={account} />
        <View style={styles.body}>{children}</View>
      </View>
    </TouchableWithoutFeedback>
  );
}

GroupItem.padding = Space.space3;
GroupItem.backgroundColor = Color.white;

const borderWidth = Border.width2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    padding: GroupItem.padding,
    paddingLeft: GroupItem.padding - borderWidth,
    backgroundColor: GroupItem.backgroundColor,
    borderLeftWidth: borderWidth,
    borderLeftColor: GroupItem.backgroundColor,
  },
  containerPressed: {
    backgroundColor: Color.yellow0,
    borderLeftColor: Color.yellow4,
  },
  body: {
    flex: 1,
    paddingLeft: GroupItem.padding,
  },
});
