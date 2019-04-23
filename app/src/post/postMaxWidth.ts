import {Font, Space} from "../atoms";
import {AccountAvatar} from "../account/AccountAvatar";

/**
 * The maximum width of the post UI. We set a max width to make sure that text
 * stays legible while also allowing for UI “decoration” like the
 * account avatar.
 */
export const postMaxWidth =
  Space.space3 + AccountAvatar.size + Space.space3 + Font.maxWidth;
