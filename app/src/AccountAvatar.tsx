import {Color, Space} from "./atoms";
import {Image, StyleSheet, View} from "react-native";
import {Account} from "./MockData";
import React from "react";

export function AccountAvatar({account}: {account: Account}) {
  return (
    <View style={styles.container}>
      <Image style={styles.image} source={{uri: account.avatarURL}} />
    </View>
  );
}

AccountAvatar.size = Space.space6;

const styles = StyleSheet.create({
  container: {
    width: AccountAvatar.size,
    height: AccountAvatar.size,
    borderRadius: AccountAvatar.size / 2,
    backgroundColor: Color.grey1,
  },
  image: {
    width: AccountAvatar.size,
    height: AccountAvatar.size,
    borderRadius: AccountAvatar.size / 2,
  },
});
