import * as React from "react";
import { StyleSheet, Image } from "react-native";
import { lineHeight } from "./StyleConstants";

export function ProfileImage({ image }: { image: string }) {
  return <Image style={styles.image} source={{ uri: image }} />;
}

ProfileImage.size = lineHeight * 2;

let styles = StyleSheet.create({
  image: {
    width: ProfileImage.size,
    height: ProfileImage.size,
    borderRadius: ProfileImage.size / 2,
    backgroundColor: "#CCCCCC",
  },
});
