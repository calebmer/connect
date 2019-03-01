import * as React from "react";
import {Text, StyleSheet, TextProps as NativeTextProps} from "react-native";
import * as Color from "./Color";
import * as Font from "./Font";

interface TextProps extends NativeTextProps {
  readonly children: string;
}

export function BodyText(props: TextProps) {
  return <Text {...props} style={styles.body} />;
}

export function TitleText(props: TextProps) {
  return <Text {...props} style={styles.title} />;
}

const styles = StyleSheet.create({
  body: {
    color: Color.grey6,
    ...Font.serif,
    ...Font.size2,
  },
  title: {
    color: Color.black,
    ...Font.sansBold,
    ...Font.size4,
  },
});
