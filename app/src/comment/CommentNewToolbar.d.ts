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
   * The toolbar might scroll the scroll view it is associated with. So we
   * require a ref to that scroll view.
   */
  scrollViewRef: React.RefObject<ScrollView>;
}>;
