import * as React from "react";
import {useState} from "react";
import {View, StyleSheet, Platform} from "react-native";
import {TextInput, TextInputInstance} from "./TextInput";
import {Space, TitleText, BodyText, Button, Color, Border} from "./atoms";

export function SignIn() {
  const passwordInput = React.createRef<TextInputInstance>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSignIn() {
    fetch("/api/account/signIn", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({email, password}),
    })
      .then(r => r.json())
      .then(console.log)
      .catch(e => console.error(e.stack));
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.title}>
          <TitleText>Sign In</TitleText>
        </View>
        <View style={styles.subtitle}>
          <BodyText>Welcome back!</BodyText>
        </View>
        <TextInput
          value={email}
          onChangeText={setEmail}
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
        <View style={styles.password}>
          <TextInput
            ref={passwordInput}
            value={password}
            onChangeText={setPassword}
            label="Password"
            secureTextEntry={true}
            autoCapitalize="none"
            autoComplete={
              Platform.OS === "web" ? "current-password" : "password"
            }
            selectTextOnFocus={true}
            textContentType="password"
            returnKeyType="go"
            onSubmitEditing={handleSignIn}
          />
        </View>

        <Button label="Sign In" onPress={handleSignIn} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    backgroundColor: Color.white,
    borderTopWidth: Border.width3,
    borderTopColor: Color.yellow4,
  },
  card: {
    padding: Space.space5,
    paddingTop: Space.space7,
    width: "100%",
    maxWidth: Space.space14,
  },
  title: {
    paddingBottom: Space.space1,
  },
  subtitle: {
    paddingBottom: Space.space5,
  },
  password: {
    paddingVertical: Space.space4,
  },
});
