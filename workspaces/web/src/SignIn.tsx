import * as React from "react";
import {View, StyleSheet} from "react-native";
import {TextInput} from "./TextInput";
import {Space, Color} from "./atoms";

export function SignIn() {
  return (
    <View style={styles.container}>
      <View style={styles.header} />
      <View style={styles.card}>
        <TextInput label="Email" />
        <View style={styles.space} />
        <TextInput label="Password" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    // backgroundColor: Color.grey9,
  },
  header: {
    flex: 0.2,
  },
  space: {
    height: Space.space5,
  },
  card: {
    padding: Space.space6,
    width: "100%",
    maxWidth: Space.space14,
    backgroundColor: Color.white,
    // borderColor: Color.grey8,
    // borderWidth: Border.width0,
    // borderRadius: Border.radius1,
  },
});
