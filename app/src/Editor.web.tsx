import {Color, Font, Space} from "./atoms";
import React, {useRef, useState} from "react";
import {StyleSheet, Text, View} from "react-native";
import {EditorProps} from "./EditorProps";
import {createElement} from "react-native-web";

declare const document: any;

/**
 * Alright folks, let’s get crazy with our web editor component! Our web editor
 * uses [`contentEditable`][1] which is known to be quite wild in everything
 * it allows.
 *
 * There have been some pretty insane engineering efforts which have gone into
 * taming `contentEditable`.
 *
 * - Facebook created [Draft.js][2] which is an absolutely huge library
 *   effectively re-implementing browser editing.
 * - Medium has a [fancy model][3] and they reinterpret all events as actions on
 *   that model.
 *
 * These approaches are _big_ engineering solutions to the problem. Instead of
 * doing something like that, our editor:
 *
 * - Accepts that we can’t tame `contentEditable`.
 * - Embraces the browser engineering effort that goes into `contentEditable`.
 * - Patches really bad ways the user can introduce non-standard styles.
 * - Serializes content from the editor using, roughly, the HTML
 *   [`innerText`][4] algorithm.
 *
 * Importantly, we don’t try to render HTML created with `contentEditable`
 * anywhere outside of the editor it was created in. We serialize to a markup
 * format (using an [`innerText`][4] like algorithm) and render that wherever
 * the content is viewed.
 *
 * To get an overview of the user input events we should watch out for, see
 * the [Draft.js event listeners][5] and their corresponding
 * [event handlers][6].
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content
 * [2]: https://draftjs.org
 * [3]: https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480
 * [4]: https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute
 * [5]: https://github.com/facebook/draft-js/blob/f9f5fd6ed1df237389b6bfe9db90e62fe7d4237c/src/component/base/DraftEditor.react.js#L392-L411
 * [6]: https://github.com/facebook/draft-js/tree/f9f5fd6ed1df237389b6bfe9db90e62fe7d4237c/src/component/handlers/edit
 */
export function Editor({placeholder}: EditorProps) {
  const editor = useRef<HTMLDivElement>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  function handleInput() {
    setShowPlaceholder(editor.current ? isEditorEmpty(editor.current) : true);
  }

  /**
   * Don’t allow the user to paste raw HTML into the editor. Instead, force the
   * clipboard data to plain text and then insert it.
   */
  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    // Oh goodness, we don’t want the default behavior here!!! The default is
    // to paste the clipboard content as fully styled HTML 😱
    //
    // Instead we only want to paste plain text.
    event.preventDefault();

    // Get the paste data from our clipboard as plain text. Not as HTML!
    const pasteData = event.clipboardData.getData("text/plain");

    // Insert the pasted data into our document using `document.execCommand()`
    // which lets the browser do its native behavior thing.
    //
    // Newlines are preserved with this approach! Manually creating a text node
    // would not work since we need to replace `\n` characters with `<br>`.
    document.execCommand("insertText", false, pasteData);
  }

  // Use the React Native Web styling engine to create a `contentEditable` div.
  return (
    <View style={styles.container}>
      {showPlaceholder && (
        <Text
          style={styles.placeholder}
          pointerEvents="none"
          selectable={false}
        >
          {placeholder}
        </Text>
      )}
      {createElement("div", {
        ref: editor,
        style: styles.editor,
        contentEditable: true,
        onInput: handleInput,
        onPaste: handlePaste,
      })}
    </View>
  );
}

/**
 * Is our editor element empty? We use this to determine whether or not we
 * should show the placeholder.
 *
 * Our document is considered empty when:
 *
 * - There are no text nodes with content.
 * - There are no `<br>` elements.
 */
function isEditorEmpty(node: any): boolean {
  // If there is a `<br>` element then that means we have an empty line in our
  // editor so it is not empty.
  //
  // We want to consider a single `<br>` element in the editor to be an
  // empty editor.
  if (node.nodeType === 1 && node.tagName === "BR" && !isFirstNode(node)) {
    return false;
  }

  // Is this a text node with some text content? If so then our editor is
  // not empty.
  if (node.nodeType === 3 && node.wholeText.length > 0) {
    return false;
  }

  // Check to see if all of our child nodes are empty.
  for (let i = 0; i < node.childNodes.length; i++) {
    if (!isEditorEmpty(node.childNodes[i])) {
      return false;
    }
  }

  return true;
}

/**
 * Is this the very first node in our content editable?
 */
function isFirstNode(node: any): boolean {
  if (node.contentEditable === "true") {
    return true;
  }
  if (node.parentNode.firstChild !== node) {
    return false;
  }
  return isFirstNode(node.parentNode);
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  placeholder: {
    position: "absolute",
    top: Space.space3,
    left: Space.space3,
    color: Color.grey3,
    ...Font.serif,
    ...Font.size2,
  },
  editor: {
    flex: 1,
    padding: Space.space3,
    color: Color.grey8,
    ...Font.serif,
    ...Font.size2,
    outlineWidth: 0,
  },
});
