import {PostID} from "@connect/api-client";
import React from "react";
import {ScrollView} from "react-native";

export const CommentNewToolbar: React.ComponentType<{
  /**
   * The ID of the post we are commenting on.
   */
  postID: PostID;

  /**
   * Whether or not we should show the jump button. When this prop changes we
   * will animate the jump button in and out of view.
   */
  showJumpButton: boolean;

  /**
   * Scrolls to the end of the scroll view that the toolbar is attached to.
   */
  onJumpToEnd: () => void;
}>;
