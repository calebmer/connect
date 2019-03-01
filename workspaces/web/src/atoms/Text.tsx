import * as React from "react";
import {Text, StyleSheet, TextProps} from "react-native";
import * as Color from "./Color";
import * as Font from "./Font";

export function BodyText(props: TextProps & {readonly children: string}) {
  return <Text {...props} style={styles.body} />;
}

export function HeaderText(props: TextProps & {readonly children: string}) {
  return <Text {...props} style={styles.header} />;
}

const styles = StyleSheet.create({
  body: {
    color: Color.grey3,
    ...Font.serif,
    ...Font.size2,
  },
  header: {
    color: Color.black,
    ...Font.sansBold,
    ...Font.size4,
  },
});
