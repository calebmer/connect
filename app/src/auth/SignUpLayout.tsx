import {Color, Space} from "../atoms";
import {StyleSheet, View} from "react-native";
import React from "react";
import {StrokeLayout} from "../frame/StrokeLayout";

export function SignUpLayout({children}: {children: React.Node}) {
  return (
    <StrokeLayout>
      <View style={styles.card}>{children}</View>
    </StrokeLayout>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    maxWidth: Space.space14,
    padding: Space.space4,
    paddingTop: Space.space7,
    marginHorizontal: "auto",
    backgroundColor: Color.white,
  },
});
