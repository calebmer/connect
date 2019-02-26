import * as React from "react";
import { StyleSheet, Image } from "react-native";
import { lineHeight } from "./StyleConstants";

export function ProfileImage({ image }: { image: string }) {
  return <Image style={styles.image} source={{ uri: image }} />;
}

let imageSize = lineHeight * 2;

let styles = StyleSheet.create({
  image: {
    width: imageSize,
    height: imageSize,
    borderRadius: imageSize / 2,
  },
});
