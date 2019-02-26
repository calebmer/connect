import * as React from "react";
import { View, StyleSheet } from "react-native";
import { Message } from "../src/Message";
import { GridWireFrame } from "../src/GridWireFrame";
import { lineHeight } from "../src/StyleConstants";

export default function IndexPage() {
  return (
    <>
      <GridWireFrame>
        <View style={styles.messageList}>
          <Message />
          <Message />
          <Message />
        </View>
      </GridWireFrame>
    </>
  );
}

let styles = StyleSheet.create({
  messageList: {
    paddingVertical: lineHeight / 2,
  },
});
