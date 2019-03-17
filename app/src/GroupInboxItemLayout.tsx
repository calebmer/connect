import React, {ReactNode} from "react";
import {StyleSheet, View} from "react-native";
import {Account} from "./MockData";
import {AccountSignature} from "./AccountSignature";
import {Color} from "./atoms";

export function GroupInboxItemLayout({
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

GroupInboxItemLayout.padding = AccountSignature.padding;
GroupInboxItemLayout.backgroundColor = Color.white;

const styles = StyleSheet.create({
  item: {
    backgroundColor: GroupInboxItemLayout.backgroundColor,
  },
});
