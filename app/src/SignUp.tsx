import React, {useState, useRef} from "react";
import {View, StyleSheet, Platform} from "react-native";
import {APIError, APIErrorCode} from "@connect/api-client";
import {API} from "./api";
import {
  Space,
  TitleText,
  BodyText,
  Button,
  MetaText,
  MetaLinkText,
  TextLink,
} from "./atoms";
import {TextInput, TextInputInstance} from "./TextInput";
import {displayErrorMessage} from "./ErrorMessage";
import {SignUpLayout} from "./SignUpLayout";

export function SignUp() {
  // References to text inputs.
  const displayNameInput = useRef<TextInputInstance | null>(null);
  const emailInput = useRef<TextInputInstance | null>(null);
  const passwordInput = useRef<TextInputInstance | null>(null);

  // Input state variables.
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check if the display name is in a valid format.
  let displayNameError: string | undefined;
  if (displayName === "") {
    displayNameError = "A name is required.";
  } else if (displayName.length < 2) {
    displayNameError = "Your name should have at least 2 characters.";
  }

  // Check if the email is in a valid format.
  let emailError: string | undefined;
  if (email === "") {
    emailError = "An email address is required.";
  } else if (!/^.*@.*\..+$/.test(email)) {
    // Emails are really complex. We use a pretty dumb regex to check them.
    emailError = "Please enter a correct email address.";
  }

  // Check if the password is in a valid format.
  let passwordError: string | undefined;
  if (password === "") {
    passwordError = "A password is required.";
  } else if (password.length < 8) {
    passwordError = "Your password should have at least 8 characters.";
  }

  // Server error state variables.
  const [attempted, setAttempted] = useState(false);
  const [displayNameServerError, setDisplayNameServerError] =
    useState<string | undefined>(undefined); // prettier-ignore
  const [emailServerError, setEmailServerError] =
    useState<string | undefined>(undefined); // prettier-ignore
  const [passwordServerError, setPasswordServerError] =
    useState<string | undefined>(undefined); // prettier-ignore

  function handleSignUp() {
    // We have now attempted to sign up!
    setAttempted(true);

    // Reset server errors.
    setDisplayNameServerError(undefined);
    setEmailServerError(undefined);
    setPasswordServerError(undefined);

    // Check client side errors. If we have any then focus the associated input.
    // Force the user to fix their errors before continuing.
    if (displayNameError) {
      if (displayNameInput.current) displayNameInput.current.focus();
      return;
    }
    if (emailError) {
      if (emailInput.current) emailInput.current.focus();
      return;
    }
    if (passwordError) {
      // We can’t re-focus an element immediately after it is blurred, so wait a
      // tick before re-focusing the element.
      setTimeout(() => {
        if (passwordInput.current) passwordInput.current.focus();
      }, 5);
      return;
    }

    // Actually sign up!
    API.account
      .signUp({
        displayName,
        email,
        password,
      })
      // If we got an error then resolve with that error instead of rejecting.
      .then(() => undefined, error => error)
      .then(error => {
        if (error === undefined) {
          // TODO
        } else {
          // Set server error.
          if (
            error instanceof APIError &&
            error.code === APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED
          ) {
            setEmailServerError(displayErrorMessage(error));
            if (emailInput.current) emailInput.current.focus();
          } else {
            setDisplayNameServerError(displayErrorMessage(error));
            if (displayNameInput.current) displayNameInput.current.focus();
          }
        }
      });
  }

  return (
    <SignUpLayout>
      <View style={styles.title}>
        <TitleText>Sign Up</TitleText>
      </View>
      <View style={styles.subtitle}>
        <BodyText>
          What would you like to be called? Your first name is fine.
        </BodyText>
      </View>
      <TextInput
        ref={displayNameInput}
        value={displayName}
        onChangeText={setDisplayName}
        label="Name"
        placeholder="Taylor"
        errorMessage={
          attempted ? displayNameServerError || displayNameError : undefined
        }
        autoCapitalize="words"
        autoComplete="given-name"
        textContentType="givenName"
        returnKeyType="next"
        onSubmitEditing={() => {
          if (emailInput.current) {
            emailInput.current.focus();
          }
        }}
        // Only auto-focus on web because on mobile the keyboard will cover up
        // the sign-up/sign-in link at the bottom of the screen.
        //
        // Since we don’t have any other means of navigation at this point in
        // the app, auto-focusing is pretty inconvenient.
        autoFocus={Platform.OS === "web"}
      />
      <View style={styles.input}>
        <TextInput
          ref={emailInput}
          value={email}
          onChangeText={setEmail}
          label="Email"
          placeholder="taylor@example.com"
          errorMessage={attempted ? emailServerError || emailError : undefined}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
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
          errorMessage={
            attempted ? passwordServerError || passwordError : undefined
          }
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
      <View style={styles.meta}>
        <MetaText>Already have an account? </MetaText>
        <TextLink onPress={() => console.log("TODO")}>
          <MetaLinkText>Sign in.</MetaLinkText>
        </TextLink>
      </View>
    </SignUpLayout>
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
    flexDirection: "row",
    paddingTop: Space.space5,
  },
});
