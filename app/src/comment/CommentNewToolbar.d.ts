import React from "react";
import {ScrollView} from "react-native";

export const CommentNewToolbar: React.ComponentType<{
  /**
   * The toolbar might scroll the scroll view it is associated with. So we
   * require a ref to that scroll view.
   */
  scrollViewRef: React.RefObject<ScrollView>;
}>;
