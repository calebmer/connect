import * as Color from "./Color";
import * as Font from "./Font";
import {TextProps as NativeTextProps, StyleSheet, Text} from "react-native";
import React, {ReactNode} from "react";

interface TextProps extends NativeTextProps {
  readonly children: ReactNode;
}

export function BodyText(props: TextProps) {
  return <Text {...props} style={[props.style, styles.body]} />;
}

export function BodyItalicText(props: TextProps) {
  return (
    <Text {...props} style={[props.style, styles.body, Font.serifItalic]} />
  );
}

export function LabelText(props: TextProps) {
  return (
    <Text {...props} style={[props.style, styles.label]} numberOfLines={1} />
  );
}

export function TitleText(props: TextProps) {
  return <Text {...props} style={[props.style, styles.title]} />;
}

export function MetaText(props: TextProps) {
  return <Text {...props} style={[props.style, styles.meta]} />;
}

export function MetaLinkText(props: TextProps) {
  return (
    <Text {...props} style={[props.style, styles.meta, styles.metaLink]} />
  );
}

const styles = StyleSheet.create({
  body: {
    color: Color.grey7,
    ...Font.serif,
    ...Font.size2,
  },
  label: {
    color: Color.black,
    ...Font.serifBold,
    ...Font.size2,
    lineHeight: Font.size2.fontSize,
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
