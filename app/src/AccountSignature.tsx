import {LabelText, Space} from "./atoms";
import React, {ReactNode} from "react";
import {StyleSheet, View} from "react-native";
import {Account} from "./MockData";
import {AccountAvatar} from "./AccountAvatar";

export function AccountSignature({
  account,
  children,
}: {
  account: Account;
  children: ReactNode;
}) {
  return (
    <View style={styles.container}>
      <AccountAvatar account={account} />
      <View style={styles.body}>
        <LabelText>{account.displayName}</LabelText>
        {children}
      </View>
    </View>
  );
}

AccountSignature.padding = Space.space3;
AccountSignature.minHeight = AccountAvatar.size + AccountSignature.padding * 2;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    padding: AccountSignature.padding,
  },
  body: {
    flex: 1,
    paddingLeft: AccountSignature.padding,
  },
});
