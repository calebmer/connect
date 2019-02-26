import * as React from "react";
import { View, StyleSheet } from "react-native";
import { BodyText } from "./Text";
import { ProfileSignature } from "./ProfileSignature";

export function Message({
  name,
  image,
  message,
  time,
  withoutSignature = false,
}: {
  name: string;
  image: string;
  message: string;
  time: string;
  withoutSignature?: boolean;
}) {
  let body = <BodyText>{message}</BodyText>;
  return !withoutSignature ? (
    <ProfileSignature name={name} image={image} time={time}>
      {body}
    </ProfileSignature>
  ) : (
    <View style={styles.containerWithoutSignature}>{body}</View>
  );
}

let styles = StyleSheet.create({
  containerWithoutSignature: {
    paddingLeft: ProfileSignature.sidebarWidth,
  },
});
