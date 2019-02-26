import * as React from "react";
import { View, StyleSheet } from "react-native";
import { BodyText } from "./Text";
import { ProfileSignature } from "./ProfileSignature";
import { lineHeight } from "./StyleConstants";

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
  return (
    <View
      style={[
        styles.container,
        withoutSignature && styles.containerWithoutSignature,
      ]}
    >
      {!withoutSignature ? (
        <ProfileSignature name={name} image={image} time={time}>
          {body}
        </ProfileSignature>
      ) : (
        body
      )}
    </View>
  );
}

let styles = StyleSheet.create({
  container: {
    paddingVertical: lineHeight / 2,
    paddingHorizontal: lineHeight,
  },
  containerWithoutSignature: {
    paddingLeft: ProfileSignature.sidebarWidth + lineHeight,
  },
});
