// Static measurements for a post that we share among modules. Doesn’t depend
// on any “heavy” modules like `Post.tsx`.

import {CommentMeasurements} from "../comment/CommentMeasurements";
import {Font} from "../atoms";

export const PostMeasurements = {
  // The maximum width is designed to give a comment `Font.maxWidth` which
  // means the post text will end up being a bit wider.
  maxWidth:
    CommentMeasurements.paddingLeft +
    Font.maxWidth +
    CommentMeasurements.paddingRight,
};
