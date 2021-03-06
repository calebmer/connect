import {Color, Font, Space} from "../atoms";
import {EditorInstance, EditorProps} from "./EditorShared";
import React, {useCallback, useImperativeHandle, useRef, useState} from "react";
import {StyleSheet, Text, View} from "react-native";
import {createElement} from "react-native-web";

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
 * format using an [`innerText`][4] like algorithm specified in
 * `getEditorContent()` and render that wherever the content is viewed.
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
function Editor(
  {
    large,
    placeholder,
    disabled,
    minLines,
    maxLines,
    paddingRight,
    onChange,
    onFocus,
    onKeyDownWeb,
  }: EditorProps,
  ref: React.Ref<EditorInstance>,
) {
  const editor = useRef<HTMLDivElement>(null);
  const [showPlaceholder, setShowPlaceholder] = useState(true);

  /**
   * When there’s an input event, compute whether or not we should hide
   * the placeholder.
   *
   * Also send an `onChange` event with the information that is cheap
   * to compute.
   */
  const handleChange = useCallback(() => {
    // Is the editor currently _completely_ empty? If there is whitespace in the
    // editor, it is not empty.
    const isEmpty = editor.current ? isEditorEmpty(editor.current) : true;

    // Only show the placeholder if the input is completely empty.
    setShowPlaceholder(isEmpty);

    if (onChange) {
      // Does the editor only contain whitespace right now?
      const isWhitespaceOnly = editor.current
        ? isEditorWhitespaceOnly(editor.current)
        : true;

      onChange({isWhitespaceOnly});
    }
  }, [onChange]);

  // Add instance methods to our component...
  useImperativeHandle(
    ref,
    () => ({
      getContent() {
        if (editor.current) {
          // The content of our editor currently needs to be computed. Getting
          // the inner text from our editor can be expensive. It is O(n) and
          // will trigger a browser reflow if all the content hasn’t been
          // laid out.
          return getEditorContent(editor.current);
        } else {
          return "";
        }
      },
      clearContent() {
        // Remove all the children from our HTML editor element.
        if (editor.current) {
          const element = editor.current;
          while (element.firstChild) {
            element.removeChild(element.firstChild);
          }
        }

        // Since we just changed the editor contents, let’s make sure to re-run
        // our `handleChange` function.
        handleChange();
      },
      focus() {
        if (editor.current) {
          editor.current.focus();
        }
      },
    }),
    [handleChange],
  );

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

  // Get the font size for our editor.
  const fontSize = large ? Font.size3 : Font.size2;

  // The minimum height of our editor is measured based on the font size
  // and `minLines`.
  const minHeight =
    minLines !== undefined
      ? fontSize.lineHeight * minLines + Space.space3 * 2
      : undefined;

  // The maximum height of our editor is measured based on the font size
  // and `maxLines`.
  const maxHeight =
    maxLines !== undefined
      ? fontSize.lineHeight * maxLines + Space.space3 * 2
      : undefined;

  // If we have a max height then when we have more content then the editor
  // can fit we should scroll.
  const overflowX = maxHeight !== undefined ? "scroll" : undefined;

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
        style: [
          styles.editor,
          large && styles.editorLarge,
          {minHeight, maxHeight, overflowX, paddingRight},
        ],
        contentEditable: !disabled,
        onInput: handleChange,
        onPaste: handlePaste,
        onFocus: onFocus,
        onKeyDown: onKeyDownWeb,
      })}
    </View>
  );
}

const _Editor = React.forwardRef(Editor);
export {_Editor as Editor};

/**
 * Since we override the global `Text` type in this scope, give our DOM text
 * type a unique name.
 */
type DOMText = ReturnType<Document["createTextNode"]>;

/**
 * Gets the content out of a `contentEditable` editor into a string we can save
 * to the database and display on all platforms.
 *
 * Roughly based on the [HTML `innerText` algorithm][1].
 *
 * [1]: https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute
 */
function getEditorContent(node: Node): string {
  let result = "";

  // Recursively process our node’s children...
  for (let i = 0; i < node.childNodes.length; i++) {
    innerTextCollection(node.childNodes[i]);
  }

  return result;

  function innerTextCollection(node: Node) {
    // Add an optional line break if this is a block display node.
    if (
      isElement(node) &&
      isBlockLevelDisplay(getComputedStyle(node).display)
    ) {
      addOptionalLineBreak();
    }

    // Recursively process our node’s children...
    for (let i = 0; i < node.childNodes.length; i++) {
      innerTextCollection(node.childNodes[i]);
    }

    // Is this a text node then add its content to our results list.
    if (isElement(node) && node.tagName === "BR") addText("\n");

    // Is this a text node then add its content to our results list.
    if (isText(node) && node.wholeText.length > 0) addText(node.wholeText);

    // Add an optional line break if this is a block display node.
    if (
      isElement(node) &&
      isBlockLevelDisplay(getComputedStyle(node).display)
    ) {
      addOptionalLineBreak();
    }
  }

  function addText(text: string) {
    result += text;
  }

  function addOptionalLineBreak() {
    if (result.length > 0 && result[result.length - 1] !== "\n") {
      result += "\n";
    }
  }
}

/**
 * Is this a [`block-level`][1] display?
 *
 * [1]: https://drafts.csswg.org/css-display/#block-level
 */
function isBlockLevelDisplay(display: string | null): boolean {
  switch (display) {
    case "block":
    case "flow-root":
    case "flex":
    case "grid":
    case "table":
      return true;
    default:
      return false;
  }
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
function isEditorEmpty(node: Node): boolean {
  // If there is a `<br>` element then that means we have an empty line in our
  // editor so it is not empty.
  //
  // We want to consider a single `<br>` element in the editor to be an
  // empty editor.
  if (isElement(node) && node.tagName === "BR" && !isFirstNode(node)) {
    return false;
  }

  // Is this a text node with some text content? If so then our editor is
  // not empty.
  if (isText(node) && node.wholeText.length > 0) {
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
function isFirstNode(node: Node): boolean {
  if ((node as HTMLElement).contentEditable === "true") {
    return true;
  }
  if (node.parentNode === null) {
    return true;
  }
  if (node.parentNode.firstChild !== node) {
    return false;
  }
  return isFirstNode(node.parentNode);
}

/**
 * Does our editor content only contain whitespace? We use this as a client side
 * validation to determine whether we should submit the post.
 *
 * Our document is consider whitespace only when:
 *
 * - All the text nodes match `/^\s*$/`.
 * - `<br>` nodes are whitespace so their existence does not change our result.
 */
function isEditorWhitespaceOnly(node: Node): boolean {
  // Is this a text node with some text content? If so then our editor is
  // not empty.
  if (node.nodeType === 3 && !/^\s*$/.test((node as DOMText).wholeText)) {
    return false;
  }

  // Check to see if all of our child nodes are empty.
  for (let i = 0; i < node.childNodes.length; i++) {
    if (!isEditorWhitespaceOnly(node.childNodes[i])) {
      return false;
    }
  }

  return true;
}

function isElement(node: Node): node is Element {
  return node.nodeType === 1;
}

function isText(node: Node): node is DOMText {
  return node.nodeType === 3;
}

const styles = StyleSheet.create({
  container: {
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
    boxSizing: "border-box",
    padding: Space.space3,
    color: Color.grey8,
    ...Font.serif,
    ...Font.size2,
    outlineWidth: 0,
  },
  editorLarge: {
    ...Font.size3,
  },
});
