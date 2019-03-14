import React, {ReactNode} from "react";
import {StyleSheet, View} from "react-native";
import {Account} from "./MockData";
import {AccountSignature} from "./AccountSignature";
import {Color} from "./atoms";

export function GroupItem({
  account,
  children,
}: {
  account: Account;
  children: ReactNode;
}) {
  return (
    <View style={styles.item}>
      <AccountSignature account={account}>{children}</AccountSignature>
    </View>
  );
}

GroupItem.padding = AccountSignature.padding;
GroupItem.backgroundColor = Color.white;

const styles = StyleSheet.create({
  item: {
    backgroundColor: GroupItem.backgroundColor,
  },
});
