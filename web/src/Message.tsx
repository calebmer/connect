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
          and on press next on page3, you would manipulate state to change page#
          or any other variable that would then make it show page 4. same for
          page 5. now if someone presses back on any of 3,4,5, they would end up
          on page 2
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
