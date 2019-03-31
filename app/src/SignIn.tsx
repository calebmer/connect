import {APIError, APIErrorCode} from "@connect/api-client";
import {AccountTestRoute, SignUpRoute} from "./router/AllRoutes";
import {
  BodyText,
  Button,
  MetaLinkText,
  MetaText,
  Space,
  TextLink,
  TitleText,
} from "./atoms";
import {Platform, StyleSheet, View} from "react-native";
import React, {useRef, useState} from "react";
import {TextInput, TextInputInstance} from "./TextInput";
import {API} from "./api/API";
import {Route} from "./router/Route";
import {Layout} from "./Layout";
import {displayErrorMessage} from "./ErrorMessage";

export function SignIn({
  route,
  signUpRoute,
}: {
  route: Route;
  signUpRoute?: Route;
}) {
  // Text input refs.
  const emailInput = useRef<TextInputInstance | null>(null);
  const passwordInput = useRef<TextInputInstance | null>(null);

  // Input state.
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Check if the email is in a valid format.
  let emailError: string | undefined;
  if (email === "") {
    emailError = "An email address is required.";
  }

  // Check if the password is in a valid format.
  let passwordError: string | undefined;
  if (password === "") {
    passwordError = "A password is required.";
  }

  // Server error state variables.
  const [attempted, setAttempted] = useState(false);
  const [emailServerError, setEmailServerError] =
    useState<string | undefined>(undefined); // prettier-ignore
  const [passwordServerError, setPasswordServerError] =
    useState<string | undefined>(undefined); // prettier-ignore

  /**
   * When the user presses the sign in button or submits the form it’s time to
   * handle their sign in request!
   */
  function handleSignIn() {
    // We have now attempted to sign in!
    setAttempted(true);

    // Reset server errors.
    setEmailServerError(undefined);
    setPasswordServerError(undefined);

    // Check client side errors. If we have any then focus the associated input.
    // Force the user to fix their errors before continuing.
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
      .signIn({email, password})
      // If we got an error then resolve with that error instead of rejecting.
      .then(() => undefined, error => error)
      .then(error => {
        if (error === undefined) {
          // Navigate into the app after successfully signing in!
          route.nativeSwapRoot(AccountTestRoute, {});
        } else {
          // If we got an error then decide which input to display the error on.
          if (
            error instanceof APIError &&
            error.code === APIErrorCode.SIGN_IN_INCORRECT_PASSWORD
          ) {
            setPasswordServerError(displayErrorMessage(error));
            if (passwordInput.current) passwordInput.current.focus();
          } else {
            setEmailServerError(displayErrorMessage(error));
            if (emailInput.current) emailInput.current.focus();
          }
        }
      });
  }

  return (
    <Layout>
      <View style={styles.title}>
        <TitleText>Sign In</TitleText>
      </View>
      <View style={styles.subtitle}>
        <BodyText>Welcome back!</BodyText>
      </View>
      <TextInput
        ref={emailInput}
        value={email}
        onChangeText={setEmail}
        label="Email"
        placeholder="taylor@example.com"
        errorMessage={attempted ? emailServerError || emailError : undefined}
        autoCapitalize="none"
        autoComplete="email"
        autoCorrect={false}
        keyboardType="email-address"
        selectTextOnFocus={true}
        textContentType="emailAddress"
        returnKeyType="next"
        onSubmitEditing={() => {
          if (passwordInput.current) {
            passwordInput.current.focus();
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
          autoComplete={Platform.OS === "web" ? "current-password" : "password"}
          selectTextOnFocus={true}
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSignIn}
        />
      </View>
      <View style={styles.input}>
        <Button label="Sign In" onPress={handleSignIn} />
      </View>
      <View style={styles.meta}>
        <MetaText>Don’t have an account?{" " /* intentional space */}</MetaText>
        <TextLink
          onPress={() => {
            if (signUpRoute) {
              signUpRoute.popTo();
            } else {
              route.push(SignUpRoute, {signInRoute: route});
            }
          }}
        >
          <MetaLinkText>Sign up.</MetaLinkText>
        </TextLink>
      </View>
    </Layout>
  );
}

/**
 * 32 [bullets][1]. While secure text entry is rendered differently across
 * browsers, the theme is usually the same.
 *
 * We encourage a long password by using 32 characters. Also a power of 2. Yay
 * powers of 2!
 *
 * [1]: https://graphemica.com/2022
 */
const passwordPlaceholder = Array(32)
  .fill("\u2022")
  .join("");

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
