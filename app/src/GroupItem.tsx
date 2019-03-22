import {Color, Space} from "./atoms";
import React, {ReactNode} from "react";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";

export function GroupItem({
  account,
  children,
}: {
  account: AccountProfile;
  children: ReactNode;
}) {
  return (
    <View style={styles.container}>
      <AccountAvatar account={account} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

GroupItem.padding = Space.space3;
GroupItem.backgroundColor = Color.white;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: GroupItem.padding,
    backgroundColor: GroupItem.backgroundColor,
  },
  body: {
    flex: 1,
    paddingLeft: GroupItem.padding,
  },
});
