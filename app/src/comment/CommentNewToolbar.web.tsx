import {LayoutChangeEvent, ScrollView, StyleSheet, View} from "react-native";
import React, {useRef} from "react";
import {CommentNew} from "./CommentNew";
import {CommentNewJumpButton} from "./CommentNewJumpButton";
import {PostID} from "@connect/api-client";
import {Space} from "../atoms";

export function CommentNewToolbar({
  postID,
  scrollViewRef,
}: {
  postID: PostID;
  scrollViewRef: React.RefObject<ScrollView>;
}) {
  // The current height of the editor. `null` if the editor has not mounted yet.
  const height = useRef<number | null>(null);

  /**
   * Every layout let’s see if our height has changed. If it has then we need to
   * scroll our scroll view so that the content touching the toolbar stays
   * in view.
   */
  function handleLayout(event: LayoutChangeEvent) {
    // Remember the last height and record the current height for next time.
    const lastHeight = height.current;
    height.current = event.nativeEvent.layout.height;

    // We don’t have a previous height if we have not mounted yet.
    if (lastHeight === null) return;

    // Get the difference between the current height and the previous height
    // we will scroll our scroll view by this much.
    const heightDelta = height.current - lastHeight;

    // If the height did not change, don’t bother...
    if (heightDelta === 0) return;

    // We expect our parent component to give us a valid ref with a scroll view
    // warn if our parent gives us an empty ref.
    if (scrollViewRef.current === null) {
      console.warn("Expected to have a mounted scroll view ref."); // eslint-disable-line no-console
      return;
    }

    // Get the scrollable node which on web is our scrollable `HTMLElement`.
    const element = scrollViewRef.current.getScrollableNode();

    // When the user has scrolled to the end of their scroll view and the
    // comment toolbar _shrinks_ then the scroll view will scroll a bit to fill
    // the unused space. If we add our `heightDelta` again we’ll have a double
    // scroll which is undesirable.
    //
    // To fix this: measure how much un-scrolled content is between the toolbar
    // and the bottom of the scroll view. If there is less content then our
    // height delta don’t bother scrolling since the browser probably scrolled
    // already for us.
    if (
      heightDelta < 0 &&
      element.scrollHeight - element.scrollTop - element.clientHeight <=
        -heightDelta
    ) {
      return;
    }

    // Scroll the scroll view by the height change of our toolbar.
    element.scrollTop += heightDelta;
  }

  return (
    <View onLayout={handleLayout}>
      <View style={styles.jump} pointerEvents="box-none">
        <CommentNewJumpButton scrollViewRef={scrollViewRef} />
      </View>
      <CommentNew postID={postID} />
    </View>
  );
}

const styles = StyleSheet.create({
  jump: {
    position: "absolute",
    top: -(CommentNewJumpButton.height + Space.space2),
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
  },
});
