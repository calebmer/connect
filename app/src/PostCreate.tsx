import {Color, LabelText, Space} from "./atoms";
import {
  Keyboard,
  KeyboardEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import React, {useEffect, useState} from "react";
import {AccountAvatar} from "./AccountAvatar";
import {Editor} from "./Editor";
import {NavbarNativeScrollView} from "./NavbarNativeScrollView";
import {Route} from "./router/Route";
import {useCurrentAccount} from "./cache/AccountCache";

export function PostCreate({route}: {route: Route}) {
  // When entering new content in a `UITextView`, iOS will scroll any parent
  // `UIScrollView` down as the text view grows. We want to make sure that iOS
  // scrolls all the way to the bottom of our content (which includes some
  // padding). `paddingBottom` on `<Editor>` won’t be respected, but inset on
  // the scroll view will be respected. So do that.
  const iosInsetHack = Platform.OS === "ios";

  return (
    <>
      <NavbarNativeScrollView
        route={route}
        useTitle={() => "New Post"}
        contentInset={iosInsetHack ? {bottom: Space.space3} : undefined} // Like padding but used when scrolling in response to text input changes.
        keyboardDismissMode="none"
        keyboardShouldPersistTaps="always"
      >
        <PostCreateHeader />
        <Editor autoFocus scrollDisabled noPaddingBottom={iosInsetHack} />
      </NavbarNativeScrollView>

      {/* Fill the space behind the keyboard so that the keyboard does not hide
          any content. */}
      <View
        style={{
          height: useKeyboardHeight(),
          backgroundColor: Color.white,
        }}
      />
    </>
  );
}

function PostCreateHeader() {
  const currentAccount = useCurrentAccount();
  return (
    <View style={styles.header}>
      <AccountAvatar account={currentAccount} />
      <View style={styles.byline}>
        <LabelText>{currentAccount.name}</LabelText>
      </View>
    </View>
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
  sink: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
  },
  header: {
    flexDirection: "row",
    padding: Space.space3,
    paddingBottom: 0,
  },
  byline: {
    paddingLeft: Space.space3,
  },
});
