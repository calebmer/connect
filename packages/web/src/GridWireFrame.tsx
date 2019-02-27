import * as React from "react";
import { ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";
import { lineHeight } from "./StyleConstants";

/**
 * Renders a grid wire frame on top of our UI. Useful for checking that our UI
 * matches the grid layout.
 */
export function GridWireFrame({ children }: { children: ReactNode }) {
  const [layout, setLayout] = useState({ width: 0, height: 0 });

  const rows = [];

  for (let i = 0; i < layout.height; i += lineHeight) {
    rows.push(<View key={i} style={styles.row} />);
  }

  return (
    <>
      <View
        style={styles.grid}
        pointerEvents="none"
        onLayout={event => setLayout(event.nativeEvent.layout)}
      >
        {rows}
      </View>
      {children}
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  row: {
    height: lineHeight,
    borderBottomColor: "rgba(0, 0, 0, 0.1)",
    borderBottomWidth: 1,
  },
});
