import {
  Keyboard,
  KeyboardEvent,
  Platform,
  SafeAreaView,
  StyleSheet,
  View,
} from "react-native";
import React, {useEffect, useState} from "react";
import {Color} from "./atoms";
import {Editor} from "./Editor";
import {NavbarNative} from "./NavbarNative";
import {Route} from "./router/Route";

export function PostCreate({route}: {route: Route}) {
  return (
    <>
      {Platform.OS !== "web" && (
        <>
          <NavbarNative
            title="New Post"
            leftIcon="x"
            onLeftIconPress={() => {
              Keyboard.dismiss();
              route.pop();
            }}
          />
          <SafeAreaView>
            <View style={styles.navbarBuffer} />
          </SafeAreaView>
        </>
      )}

      <Editor autoFocus />

      {/* Fill the space behind the keyboard when the keyboard is showing. */}
      <View
        style={{
          height: useKeyboardHeight(),
          backgroundColor: Color.white,
        }}
      />
    </>
  );
}

/**
 * Return the current height of the keyboard. Will re-render the component when
 * the keyboard opens or closes.
 */
function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    function handleKeyboardWillShow(event: KeyboardEvent) {
      setKeyboardHeight(event.endCoordinates.height);
    }

    function handleKeyboardWillHide() {
      setKeyboardHeight(0);
    }

    Keyboard.addListener("keyboardWillShow", handleKeyboardWillShow);
    Keyboard.addListener("keyboardWillHide", handleKeyboardWillHide);
    return () => {
      Keyboard.removeListener("keyboardWillShow", handleKeyboardWillShow);
      Keyboard.removeListener("keyboardWillHide", handleKeyboardWillHide);
    };
  }, []);

  return keyboardHeight;
}

const styles = StyleSheet.create({
  navbarBuffer: {
    height: NavbarNative.height,
  },
});
