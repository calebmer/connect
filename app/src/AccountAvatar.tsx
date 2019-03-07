import {Color, Space} from "./atoms";
import {Image, StyleSheet, View} from "react-native";
import React from "react";

const avatarURL =
  "https://pbs.twimg.com/profile_images/1040125515665879040/jrLzK1ta_400x400.jpg";

export function AccountAvatar() {
  return (
    <View style={styles.container}>
      <Image style={styles.image} source={{uri: avatarURL}} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: Space.space6,
    height: Space.space6,
    borderRadius: Space.space6 / 2,
    backgroundColor: Color.grey1,
  },
  image: {
    width: Space.space6,
    height: Space.space6,
    borderRadius: Space.space6 / 2,
  },
});
