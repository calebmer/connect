import {Color, Font, Space} from "./atoms";
import {StyleSheet, Text, View} from "react-native";
import React from "react";

export function GroupSectionHeader({title}: {title: string}) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Space.space3,
    paddingVertical: Space.space1,
    backgroundColor: Color.white,
  },
  title: {
    color: Color.black,
    ...Font.sansBold,
    ...Font.size3,
  },
});
