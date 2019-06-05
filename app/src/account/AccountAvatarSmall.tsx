import {Color, Font, Space} from "../atoms";
import {
  Image,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";
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
  initial: {
    width: AccountAvatarSmall.size,
    color: Color.grey4,
    textAlign: "center",
    ...Font.sans,
    fontSize: Font.size4.fontSize,
    lineHeight: AccountAvatarSmall.size,
  },
});
