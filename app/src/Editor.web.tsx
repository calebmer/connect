import {EditorProps} from "./EditorProps";
import React from "react";

export function Editor({}: EditorProps) {
  return (
    <div
      contentEditable
      onInput={event => sanitizeNodeChildren(event.target)}
    />
  );
}

declare const Node: any;
declare const document: any;
declare const getComputedStyle: any;

function sanitizeNodeChildren(parentNode: any) {
  let previousRequiredLineBreakCount = -1;

  let childNode = parentNode.firstChild;

  while (childNode != null) {
    const nextNode = childNode.nextSibling;

    // https://developer.mozilla.org/en-US/docs/Web/API/Node/nodeType
    switch (childNode.nodeType) {
      // Text nodes are ok, don’t sanitize anything...
      case Node.TEXT_NODE: {
        previousRequiredLineBreakCount = 0;
        break;
      }

      case Node.ELEMENT_NODE: {
        let requiredLineBreakCount = 0;
        const {display} = getComputedStyle(childNode);
        if (isBlockLevelDisplay(display) || display === "table-caption") {
          requiredLineBreakCount = 1;
        }

        switch (childNode.tagName) {
          // Allow these tags...
          case "DIV":
          case "SPAN":
          case "P":
          case "BR":
          case "STRONG":
          case "EM":
          case "B":
          case "I": {
            const attributeNames = childNode.getAttributeNames();
            for (let i = 0; i < attributeNames.length; i++) {
              childNode.removeAttribute(attributeNames[i]);
            }
            sanitizeNodeChildren(childNode);
            break;
          }

          default: {
            let innerText = childNode.innerText || "";

            const actualRequiredLineBreakCount = Math.max(
              previousRequiredLineBreakCount,
              requiredLineBreakCount,
            );
            if (
              previousRequiredLineBreakCount !== -1 &&
              actualRequiredLineBreakCount > 0
            ) {
              innerText = "\n".repeat(actualRequiredLineBreakCount) + innerText;
            }

            parentNode.replaceChild(
              document.createTextNode(innerText),
              childNode,
            );
            break;
          }
        }

        previousRequiredLineBreakCount = requiredLineBreakCount;
        break;
      }

      default: {
        parentNode.removeChild(childNode);
        break;
      }
    }

    childNode = nextNode;
  }
}

/**
 * Is this a [`block-level`][1] display?
 *
 * [1]: https://drafts.csswg.org/css-display/#block-level
 */
function isBlockLevelDisplay(display: string): boolean {
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
