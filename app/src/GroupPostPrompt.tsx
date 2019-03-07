import {BodyText, Border, Color, Shadow, Space} from "./atoms";
import {StyleSheet, View} from "react-native";
import {AccountSignature} from "./AccountSignature";
import {PencilIcon} from "./icons/PencilIcon";
import React from "react";

export function GroupPostPrompt() {
  return (
    <View style={styles.container}>
      <AccountSignature>
        <BodyText>Start a conversation…</BodyText>
      </AccountSignature>
      <PencilIcon style={styles.icon} color={Color.grey8} />
    </View>
  );
}

GroupPostPrompt.borderRadius = Border.radius1;

const styles = StyleSheet.create({
  container: {
    position: "relative",
    top: -GroupPostPrompt.borderRadius,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: Space.space4,
    backgroundColor: Color.white,
    borderRadius: GroupPostPrompt.borderRadius,
    ...Shadow.elevation2,
  },
  icon: {
    width: Space.space4,
    height: Space.space4,
  },
});
