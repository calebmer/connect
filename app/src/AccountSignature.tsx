import {LabelText, Space} from "./atoms";
import React, {ReactNode} from "react";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";

export function AccountSignature({
  account,
  children,
}: {
  account: AccountProfile;
  children: ReactNode;
}) {
  return (
    <View style={styles.container}>
      <AccountAvatar account={account} />
      <View style={styles.body}>
        <LabelText>{account.name}</LabelText>
        {children}
      </View>
    </View>
  );
}

AccountSignature.padding = Space.space3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: AccountSignature.padding,
  },
  body: {
    flex: 1,
    paddingLeft: AccountSignature.padding,
  },
});
