import * as React from "react";
import { View, StyleSheet } from "react-native";
import { ProfileSignature } from "./ProfileSignature";
import { lineHeight } from "./StyleConstants";

export function PostContent({
  name,
  image,
  time,
}: {
  name: string;
  image: string;
  time: string;
}) {
  return (
    <View style={styles.container}>
      <ProfileSignature name={name} image={image} time={time}>
        {null}
      </ProfileSignature>
    </View>
  );
}

let styles = StyleSheet.create({
  container: {
    paddingHorizontal: lineHeight,
  },
});
