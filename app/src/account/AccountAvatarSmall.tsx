import {Color, Space} from "../atoms";
import {Image, StyleProp, StyleSheet, View, ViewStyle} from "react-native";
import {AccountProfile} from "@connect/api-client";
import React from "react";

export function AccountAvatarSmall({
  style,
  account,
}: {
  style?: StyleProp<ViewStyle>;
  account: AccountProfile;
}) {
  return (
    <View style={[style, styles.container]}>
      {account.avatarURL && (
        <Image style={styles.image} source={{uri: account.avatarURL}} />
      )}
    </View>
  );
}

AccountAvatarSmall.size = Space.space5;

const styles = StyleSheet.create({
  container: {
    width: AccountAvatarSmall.size,
    height: AccountAvatarSmall.size,
    borderRadius: AccountAvatarSmall.size / 2,
    backgroundColor: Color.grey1,
  },
  image: {
    width: AccountAvatarSmall.size,
    height: AccountAvatarSmall.size,
    borderRadius: AccountAvatarSmall.size / 2,
  },
});
