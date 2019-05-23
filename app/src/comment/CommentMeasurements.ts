import {Font, Space} from "../atoms";
import {AccountAvatarSmall} from "../account/AccountAvatarSmall";

export const CommentMeasurements = {
  paddingLeft: Space.space3 + AccountAvatarSmall.size + Space.space2,
  paddingRight: Space.space4,
  paddingTopWithByline: Space.space3,
  paddingTopWithoutByline: Font.size2.lineHeight / 3,
};
