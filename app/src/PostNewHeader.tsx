import {LabelText, Space} from "./atoms";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";
import React from "react";

export function PostNewHeader({
  currentAccount,
}: {
  currentAccount: AccountProfile;
}) {
  return (
    <View style={styles.header}>
      <AccountAvatar account={currentAccount} />
      <View style={styles.byline}>
        <LabelText>{currentAccount.name}</LabelText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    padding: Space.space3,
    paddingBottom: 0,
  },
  byline: {
    paddingLeft: Space.space3,
  },
});