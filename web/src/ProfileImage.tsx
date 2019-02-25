import * as React from "react";
import { StyleSheet, Image } from "react-native";
import { lineHeight } from "./StyleConstants";

let calebmerProfileImage =
  "https://pbs.twimg.com/profile_images/1040125515665879040/jrLzK1ta_400x400.jpg";

export function ProfileImage() {
  return <Image style={styles.image} source={{ uri: calebmerProfileImage }} />;
}

let imageSize = lineHeight * 2;

let styles = StyleSheet.create({
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: imageSize / 2,
  },
});
