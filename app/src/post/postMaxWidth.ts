import {Font, Space} from "../atoms";

/**
 * The maximum width of the post UI. We set a max width to make sure that text
 * stays legible while also allowing for UI “decoration” like the
 * account avatar.
 */
export const postMaxWidth = Space.space3 + Font.maxWidth + Space.space3;
