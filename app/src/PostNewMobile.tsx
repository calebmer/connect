import {Color, Space} from "./atoms";
import {Keyboard, KeyboardEvent, Platform, View} from "react-native";
import React, {useEffect, useState} from "react";
import {Editor} from "./Editor";
import {NavbarNativeScrollView} from "./NavbarNativeScrollView";
import {PostNewHeader} from "./PostNewHeader";
import {Route} from "./router/Route";

// TODO: Make this actually usable on mobile web. I’ll probably have to use
// content editable since the default React Native Web `<TextInput>` does
// not grow...
export function PostNewMobile({route}: {route: Route}) {
  const [content, setContent] = useState("");

  // When entering new content in a `UITextView`, iOS will scroll any parent
  // `UIScrollView` down as the text view grows. We want to make sure that iOS
  // scrolls all the way to the bottom of our content (which includes some
  // padding). `paddingBottom` on `<PostEditorInput>` won’t be respected, but
  // inset on the scroll view will be respected. So do that.
  const contentInsetHack = Platform.OS === "ios";

  return (
    <>
      <NavbarNativeScrollView
        route={route}
        useTitle={() => "New Post"}
        keyboardShouldPersistTaps="always"
        // Add some inset to the bottom of our scroll view which will replace
        // our padding.
        contentInset={contentInsetHack ? {bottom: Space.space3} : undefined}
      >
        <PostNewHeader />
        <Editor
          content={content}
          placeholder="Start a conversation…"
          autoFocus
          onChange={setContent}
        />
        {contentInsetHack && (
          // Use negative margin since we add padding to the scroll view in the
          // form of content inset.
          <View style={{marginBottom: -Space.space3}} />
        )}
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
