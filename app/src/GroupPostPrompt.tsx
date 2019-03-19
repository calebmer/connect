import {BodyText, Color, Shadow, Space} from "./atoms";
import {StyleSheet, View} from "react-native";
import {Account} from "./MockData";
import {AccountSignature} from "./AccountSignature";
import {PencilIcon} from "./icons/PencilIcon";
import React from "react";

export function GroupPostPrompt({account}: {account: Account}) {
  return (
    <View style={styles.container}>
      <AccountSignature account={account as any}>
        <BodyText>Start a conversation…</BodyText>
      </AccountSignature>
      <PencilIcon style={styles.icon} color={Color.grey8} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: Space.space4,
    paddingVertical: AccountSignature.padding,
    backgroundColor: Color.white,
    ...Shadow.elevation0,
  },
  icon: {
    width: Space.space4,
    height: Space.space4,
  },
});
