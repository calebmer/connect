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
      <View style={styles.iconCircle}>
        <Icon style={styles.icon} name="edit" color={Color.yellow8} />
      </View>
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
  iconCircle: {
    width: Space.space5,
    height: Space.space5,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: Space.space5,
    backgroundColor: Color.yellow1,
  },
  icon: {
    position: "relative",
    top: -0.7,
    right: -0.7,
  },
});
