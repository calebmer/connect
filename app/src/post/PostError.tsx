import {Color, Font, Icon, Space} from "../atoms";
import {StyleSheet, Text, View} from "react-native";
import {AppError} from "../api/AppError";
import React from "react";

export function PostError({error}: {error: unknown}) {
  return (
    <View style={styles.container}>
      <View style={styles.icon}>
        <Icon name="alert-triangle" size={Space.space7} color={Color.red4} />
      </View>
      <Text style={styles.message}>{AppError.displayMessage(error)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
  },
  icon: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Space.space10,
    marginHorizontal: Space.space3,
  },
  message: {
    marginTop: Space.space4,
    marginHorizontal: Space.space3,
    maxWidth: Space.space11,
    textAlign: "center",
    color: Color.grey8,
    ...Font.sans,
    ...Font.size3,
  },
});
