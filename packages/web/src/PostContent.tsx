import * as React from "react";
import { View, StyleSheet } from "react-native";
import { ProfileSignature } from "./ProfileSignature";
import { lineHeight } from "./StyleConstants";
import { BodyText } from "./Text";

export function PostContent({
  name,
  image,
  content,
  time,
}: {
  name: string;
  image: string;
  content: string;
  time: string;
}) {
  return (
    <View style={styles.container}>
      <ProfileSignature name={name} image={image} time={time}>
        <BodyText>{content}</BodyText>
      </ProfileSignature>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: lineHeight,
    paddingVertical: lineHeight,
  },
});
