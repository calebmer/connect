import * as React from "react";
import {useState} from "react";
import {View, StyleSheet, Platform} from "react-native";
import {TextInput, TextInputInstance} from "./TextInput";
import {Space, TitleText, BodyText, Button, Color, Border} from "./atoms";

export function SignUp() {
  const emailInput = React.createRef<TextInputInstance>();
  const passwordInput = React.createRef<TextInputInstance>();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function handleSignUp() {}

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.title}>
          <TitleText>Sign Up</TitleText>
        </View>
        <View style={styles.subtitle}>
          <BodyText>
            What would you like to be called? Your first name is fine.
          </BodyText>
        </View>
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          label="Name"
          placeholder="Taylor"
          autoFocus={true}
          autoCapitalize="words"
          autoComplete="given-name"
          selectTextOnFocus={true}
          textContentType="givenName"
          returnKeyType="next"
          onSubmitEditing={() => {
            if (emailInput.current) {
              emailInput.current.focus();
            }
          }}
        />
        <View style={styles.input}>
          <TextInput
            ref={emailInput}
            value={email}
            onChangeText={setEmail}
            label="Email"
            placeholder="taylor@example.com"
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
            value={password}
            onChangeText={setPassword}
            label="Password"
            placeholder={passwordPlaceholder}
            secureTextEntry={true}
            autoCapitalize="none"
            autoComplete={Platform.OS === "web" ? "new-password" : "password"}
            selectTextOnFocus={true}
            textContentType="newPassword"
            returnKeyType="go"
            onSubmitEditing={handleSignUp}
          />
        </View>
        <View style={styles.input}>
          <Button label="Sign Up" onPress={handleSignUp} />
        </View>
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
});
