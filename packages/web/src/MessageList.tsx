import * as React from "react";
import {View, StyleSheet} from "react-native";
import {Message} from "./Message";
import {lineHeight} from "./StyleConstants";

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
  let previousName: string | undefined = undefined;

  const messageNodes = messages.map(message => {
    const withoutSignature = previousName === message.name;
    previousName = message.name;
    return (
      <Message
        key={message.id}
        name={message.name}
        image={message.image}
        message={message.message}
        time={message.time}
        withoutSignature={withoutSignature}
      />
    );
  });

  return <View style={styles.list}>{messageNodes}</View>;
}

const styles = StyleSheet.create({
  list: {
    paddingVertical: lineHeight / 2,
  },
});