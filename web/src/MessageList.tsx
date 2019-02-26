import * as React from "react";
import { View, StyleSheet } from "react-native";
import { Message } from "./Message";
import { lineHeight } from "./StyleConstants";

export function MessageList({
  messages,
}: {
  messages: Array<{
    id: number;
    name: string;
    image: string;
    message: string;
    time: string;
  }>;
}) {
  return (
    <View style={styles.list}>
      {messages.map(message => (
        <View key={message.id} style={styles.item}>
          <Message
            name={message.name}
            image={message.image}
            message={message.message}
            time={message.time}
          />
        </View>
      ))}
    </View>
  );
}

let styles = StyleSheet.create({
  list: {
    paddingVertical: lineHeight / 2,
  },
  item: {
    paddingVertical: lineHeight / 2,
    paddingHorizontal: lineHeight,
  },
});
