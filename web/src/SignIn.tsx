import React, {useState} from "react";
import {View, StyleSheet, Platform, Text, TouchableOpacity} from "react-native";
import Router from "next/router";
import {API} from "./API";
import {
  Space,
  TitleText,
  BodyText,
  Button,
  Color,
  Border,
  MetaText,
  MetaLinkText,
} from "./atoms";
import {TextInput, TextInputInstance} from "./TextInput";

export function SignIn() {
  const passwordInput = React.createRef<TextInputInstance>();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSignIn() {
    API.account.signIn({
      email,
      password,
    });
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
          placeholder="taylor@example.com"
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
        <View style={styles.input}>
          <TextInput
            ref={passwordInput}
            value={password}
            onChangeText={setPassword}
            label="Password"
            placeholder={passwordPlaceholder}
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
        <View style={styles.input}>
          <Button label="Sign In" onPress={handleSignIn} />
        </View>
        <Text style={styles.meta}>
          <MetaText>
            Don’t have an account?{" "}
            <TouchableOpacity
              accessibilityRole="link"
              onPress={() => Router.push("/sign-up")}
            >
              <MetaLinkText>Sign up.</MetaLinkText>
            </TouchableOpacity>
          </MetaText>
        </Text>
      </View>
    </View>
  );
}

/**
 * 32 [bullets][1] with [hair spaces][2] in between since no space looks too
 * tight. While secure text entry is rendered differently across browsers, the
 * theme is usually the same.
 *
 * We encourage a long password by using 32 characters. Also a power of 2. Yay
 * powers of 2!
 *
 * [1]: https://graphemica.com/2022
 * [2]: https://graphemica.com/200A
 */
const passwordPlaceholder = Array(32)
  .fill("\u2022")
  .join("\u200A");

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
  input: {
    paddingTop: Space.space4,
  },
  meta: {
    paddingTop: Space.space5,
    textAlign: "center",
  },
});
