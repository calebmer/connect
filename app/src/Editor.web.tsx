import {EditorProps} from "./EditorProps";
import React from "react";

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
 * [1]: https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Editable_content
 * [2]: https://draftjs.org
 * [3]: https://medium.engineering/why-contenteditable-is-terrible-122d8a40e480
 * [4]: https://html.spec.whatwg.org/multipage/dom.html#the-innertext-idl-attribute
 */
export function Editor({}: EditorProps) {
  return <div contentEditable />;
}
