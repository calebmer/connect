import * as React from "react";
import {View, StyleSheet, Platform} from "react-native";
import {TextInput, TextInputInstance} from "./TextInput";
import {Space, HeaderText, BodyText, Button} from "./atoms";

export function SignIn() {
  const passwordInput = React.createRef<TextInputInstance>();
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <HeaderText>Sign In</HeaderText>
        </View>
        <BodyText>Welcome back!</BodyText>
        <View style={styles.input}>
          <TextInput
            label="Email"
            autoFocus={true}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            selectTextOnFocus={true}
            textContentType="emailAddress"
            returnKeyType="next"
            onSubmitEditing={() => {
              if (passwordInput.current) {
                passwordInput.current.focus();
              }
            }}
          />
        </View>
        <View style={styles.input}>
          <TextInput
            ref={passwordInput}
            label="Password"
            secureTextEntry={true}
            autoCapitalize="none"
            autoComplete={
              Platform.OS === "web" ? "current-password" : "password"
            }
            selectTextOnFocus={true}
            textContentType="password"
            returnKeyType="go"
          />
        </View>
        <View style={styles.button}>
          <Button label="Sign In" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  card: {
    padding: Space.space5,
    paddingTop: Space.space7,
    width: "100%",
    maxWidth: Space.space14,
  },
  header: {
    paddingBottom: Space.space1,
  },
  input: {
    paddingTop: Space.space4,
  },
  button: {
    // flexDirection: "row",
    // justifyContents: "flex-end",
    paddingTop: Space.space4,
  },
});
