import {LabelText, Space} from "./atoms";
import React, {ReactNode} from "react";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";

export function AccountSignature({children}: {children: ReactNode}) {
  return (
    <View style={styles.container}>
      <AccountAvatar />
      <View style={styles.body}>
        <LabelText>Caleb</LabelText>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    padding: Space.space3,
  },
  body: {
    flex: 1,
    paddingLeft: Space.space3,
  },
});
