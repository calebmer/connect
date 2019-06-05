import {Color, Font, Space} from "../atoms";
import {Image, StyleSheet, Text, View} from "react-native";
import {AccountAvatarSmall} from "./AccountAvatarSmall";
import {AccountProfile} from "@connect/api-client";
import React from "react";

export function AccountAvatar({account}: {account: AccountProfile}) {
  return (
    <View style={styles.container}>
      {account.avatarURL ? (
        <Image style={styles.image} source={{uri: account.avatarURL}} />
      ) : (
        <Text
          style={styles.initial}
          accessible={false}
          selectable={false}
          allowFontScaling={false}
        >
          {(account.name[0] || "?").toUpperCase()}
        </Text>
      )}
    </View>
  );
}

AccountAvatar.size = Font.size2.lineHeight * 2 - Space.space0;

const styles = StyleSheet.create({
  container: {
    width: AccountAvatar.size,
    height: AccountAvatar.size,
    marginVertical: (Font.size2.lineHeight * 2 - AccountAvatar.size) / 2,
    borderRadius: AccountAvatar.size / 2,
    backgroundColor: Color.grey1,
  },
  image: {
    width: AccountAvatar.size,
    height: AccountAvatar.size,
    borderRadius: AccountAvatar.size / 2,
  },
  initial: {
    width: AccountAvatar.size,
    color: Color.grey4,
    textAlign: "center",
    ...Font.sans,
    fontSize:
      Font.size4.fontSize * (AccountAvatar.size / AccountAvatarSmall.size),
    lineHeight: AccountAvatar.size,
  },
});
