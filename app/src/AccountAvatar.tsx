import {Color, Font, Space} from "./atoms";
import {Image, StyleSheet, View} from "react-native";
import {AccountProfile} from "@connect/api-client";
import React from "react";

export function AccountAvatar({account}: {account: AccountProfile}) {
  return (
    <View style={styles.container}>
      {account.avatarURL && (
        <Image style={styles.image} source={{uri: account.avatarURL}} />
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
});
