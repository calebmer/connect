import * as React from "react";
import { StyleSheet, View } from "react-native";
import { lineHeight } from "./StyleConstants";
import { BodyText, LabelText, LiteText } from "./Text";
import { ProfileImage } from "./ProfileImage";

export function Message() {
  return (
    <View style={styles.container}>
      <ProfileImage />
      <View style={styles.body}>
        <View style={styles.header}>
          <LabelText>Caleb Meredith</LabelText>
          <View style={styles.headerTime}>
            <LiteText>7:58 AM</LiteText>
          </View>
        </View>
        <BodyText>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Curabitur
          vulputate nibh ipsum, eget sollicitudin enim dignissim a.
        </BodyText>
      </View>
    </View>
  );
}

let styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    paddingVertical: lineHeight,
    paddingHorizontal: lineHeight,
  },
  body: {
    flex: 1,
    paddingLeft: lineHeight / 2,
  },
  header: {
    flexDirection: "row",
  },
  headerTime: {
    paddingLeft: lineHeight / 2,
  },
});
