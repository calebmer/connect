import {BodyText, Color, Icon, LabelText, Shadow, Space} from "./atoms";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";
import React from "react";

export function GroupPostPrompt({account}: {account: AccountProfile}) {
  return (
    <View style={styles.container}>
      <AccountAvatar account={account} />
      <View style={styles.body}>
        <LabelText>{account.name}</LabelText>
        <BodyText>Start a conversation…</BodyText>
      </View>
      <Icon name="edit" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: Space.space4,
    padding: Space.space3,
    backgroundColor: Color.white,
    ...Shadow.elevation0,
  },
  body: {
    flex: 1,
    paddingLeft: Space.space3,
  },
});
