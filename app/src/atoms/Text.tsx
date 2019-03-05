import * as Color from "./Color";
import * as Font from "./Font";
import {TextProps as NativeTextProps, StyleSheet, Text} from "react-native";
import React, {ReactNode} from "react";

interface TextProps extends NativeTextProps {
  readonly children: ReactNode;
}

export function BodyText(props: TextProps) {
  return <Text {...props} style={styles.body} />;
}

export function TitleText(props: TextProps) {
  return <Text {...props} style={styles.title} />;
}

export function MetaText(props: TextProps) {
  return <Text {...props} style={styles.meta} />;
}

export function MetaLinkText(props: TextProps) {
  return <Text {...props} style={[styles.meta, styles.metaLink]} />;
}

const styles = StyleSheet.create({
  body: {
    color: Color.grey7,
    ...Font.serif,
    ...Font.size2,
  },
  title: {
    color: Color.black,
    ...Font.sansBold,
    ...Font.size4,
  },
  meta: {
    color: Color.grey6,
    ...Font.sans,
    ...Font.size1,
  },
  metaLink: {
    color: Color.blue5,
    textDecorationLine: "underline",
  },
});
