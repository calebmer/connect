import {Color, Font, LabelText, Space} from "./atoms";
import {
  Keyboard,
  KeyboardEvent,
  Platform,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import React, {useEffect, useState} from "react";
import {AccountAvatar} from "./AccountAvatar";
import {NavbarNativeScrollView} from "./NavbarNativeScrollView";
import {Route} from "./router/Route";
import {useCurrentAccount} from "./cache/AccountCache";

// TODO: Make this actually usable on mobile web. I’ll probably have to use
// content editable since the default React Native Web `<TextInput>` does
// not grow...
export function PostNewMobile({route}: {route: Route}) {
  const [content, setContent] = useState("");

  return (
    <>
      <NavbarNativeScrollView
        route={route}
        useTitle={() => "New Post"}
        keyboardShouldPersistTaps="always"
        // When entering new content in a `UITextView`, iOS will scroll any
        // parent `UIScrollView` down as the text view grows. We want to make
        // sure that iOS scrolls all the way to the bottom of our content (which
        // includes some padding). `paddingBottom` on `<PostEditorInput>` won’t
        // be respected, but inset on the scroll view will be respected. So
        // do that.
        contentInset={{bottom: Platform.OS === "ios" ? Space.space3 : 0}}
      >
        <PostNewMobileHeader />
        <PostNewMobileInput content={content} setContent={setContent} />
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

function PostNewMobileHeader() {
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

function PostNewMobileInput({
  content,
  setContent,
}: {
  content: string;
  setContent: (content: string) => void;
}) {
  return (
    <TextInput
      style={styles.input}
      multiline
      value={content}
      placeholder="Start a conversation…"
      placeholderTextColor={Color.grey3}
      onChangeText={setContent}
      autoFocus
      scrollEnabled={false}
    />
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
  header: {
    flexDirection: "row",
    padding: Space.space3,
    paddingBottom: 0,
  },
  byline: {
    paddingLeft: Space.space3,
  },
  input: {
    paddingTop: Space.space3,
    paddingBottom: Platform.OS === "ios" ? 0 : Space.space3,
    paddingHorizontal: Space.space3,
    textAlignVertical: "top",
    color: Color.grey8,
    ...Font.serif,
    ...Font.size3,
  },
});
