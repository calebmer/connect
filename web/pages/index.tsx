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
          <View style={styles.message}>
            <Message />
          </View>
          <View style={styles.message}>
            <Message />
          </View>
          <View style={styles.message}>
            <Message />
          </View>
        </View>
      </GridWireFrame>
    </>
  );
}

let styles = StyleSheet.create({
  messageList: {
    paddingBottom: lineHeight,
  },
  message: {
    paddingTop: lineHeight,
    paddingHorizontal: lineHeight,
  },
});
