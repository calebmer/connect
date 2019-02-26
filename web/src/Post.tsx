import * as React from "react";
import { View, StyleSheet } from "react-native";
import { ProfileSignature } from "./ProfileSignature";
import { MessageList } from "./MessageList";
import { lineHeight } from "./StyleConstants";
import { PostContent } from "./PostContent";

export function Post({
  name,
  image,
  time,
  comments,
}: {
  name: string;
  image: string;
  time: string;
  comments: Array<{
    id: number;
    name: string;
    image: string;
    message: string;
    time: string;
  }>;
}) {
  return (
    <View style={styles.container}>
      <PostContent name={name} image={image} time={time} />
      <MessageList messages={comments} />
    </View>
  );
}

let styles = StyleSheet.create({
  container: {
    maxWidth: ProfileSignature.maxWidth + lineHeight * 2,
  },
});
