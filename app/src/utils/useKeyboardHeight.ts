import {Keyboard, KeyboardEvent} from "react-native";
import {useEffect, useState} from "react";

/**
 * Return the current height of the keyboard. Will re-render the component when
 * the keyboard opens or closes.
 */
export function useKeyboardHeight() {
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    function handleKeyboardWillShow(event: KeyboardEvent) {
      setKeyboardHeight(lastKeyboardHeight => {
        if (lastKeyboardHeight === 0) {
          return event.endCoordinates.height;
        } else {
          return lastKeyboardHeight;
        }
      });
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
