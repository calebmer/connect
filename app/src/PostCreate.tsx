import {Keyboard, KeyboardEvent, View} from "react-native";
import React, {useEffect, useState} from "react";
import {Color} from "./atoms";
import {Editor} from "./Editor";
import {NavbarNativeScrollView} from "./NavbarNativeScrollView";
import {Route} from "./router/Route";

export function PostCreate({route}: {route: Route}) {
  return (
    <>
      <NavbarNativeScrollView route={route} useTitle={() => "New Post"}>
        {/* TODO: There are a couple of bugs when writing a really long post. I
            really want to fix them. Fixing will require native code, though. */}
        <Editor autoFocus scrollDisabled />
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
