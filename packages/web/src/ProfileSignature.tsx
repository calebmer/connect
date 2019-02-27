import * as React from "react";
import {ReactNode} from "react";
import {View, StyleSheet} from "react-native";
import {ProfileImage} from "./ProfileImage";
import {LabelText, LiteText, BodyText} from "./Text";
import {lineHeight} from "./StyleConstants";

/**
 * Used to “sign” some content with a user’s profile and the time at which the
 * content was created. The user’s profile image is put on the left and their
 * name is included above the body content.
 */
export function ProfileSignature({
  name,
  image,
  time,
  children,
}: {
  name: string;
  image: string;
  time: string;
  children: ReactNode;
}) {
  return (
    <View style={styles.container}>
      <ProfileImage image={image} />
      <View style={styles.body}>
        <View style={styles.header}>
          <LabelText>{name}</LabelText>
          <View style={styles.headerTime}>
            <LiteText>{time}</LiteText>
          </View>
        </View>
        {children}
      </View>
    </View>
  );
}

ProfileSignature.sidebarWidth = ProfileImage.size + lineHeight / 2;

ProfileSignature.maxWidth =
  ProfileImage.size + lineHeight / 2 + BodyText.maxWidth;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
  },
  body: {
    flex: 1,
    maxWidth: BodyText.maxWidth,
    paddingLeft: lineHeight / 2,
  },
  header: {
    flexDirection: "row",
  },
  headerTime: {
    paddingLeft: lineHeight / 2,
  },
});