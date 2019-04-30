import {StyleSheet, Text, View} from "react-native";
import React from "react";

export function NavHeader({loggedIn}: {loggedIn: Boolean}) {
  return (
    <View style={styles.contianer}>
      <Text>Header</Text>
      {loggedIn && <Text>My Account</Text>}
    </View>
  );
}
const styles = StyleSheet.create({
  contianer: {
    flexDirection: "row",
    display: "flex",
  },
});
