import {EditorProps} from "./EditorProps";
import React from "react";

/**
 * A rich text editor for creating or updating text-based content. The editor
 * is consistent across all areas of our application.
 *
 * - Composing posts.
 * - Editing comments.
 * - Sending messages.
 *
 * On native it is implemented with a multiline `<TextInput>`. On web it is
 * implemented with `contentEditable`.
 *
 * Because of our implementation of the editor on web, computing the current
 * value of the input can be costly. So all editor components are uncontrolled.
 */
export const Editor: React.ComponentType<EditorProps>;
