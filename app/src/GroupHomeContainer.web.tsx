import {StyleSheet, View} from "react-native";
import React from "react";

export function GroupHomeContainer({children}: {children: React.Node}) {
  /**
   * Despite the fact that we set `overflow: "hidden"` on our container, it’s
   * _still_ possible to [programmatically scroll][1] the view by
   * setting `scrollTop`.
   *
   * This may happen when we have a focused input outside of the bounds of our
   * element. In our case, that would be `<PostNewPopup>`. If `<PostNewPopup>`
   * is off-screen (animated or minimized) and you type in its focused area
   * then the browser will scroll to the off-screen input even though we said
   * overflow should be hidden.
   *
   * We prevent this by watching for scroll events and immediately setting
   * [`element.scrollTop = 0`][2] whenever there is a scroll event.
   *
   * Which is kinda ridiculous because if we have `overflow: "hidden"` then
   * we don’t expect any scroll events in the first place! 😓
   *
   * [1]: https://developer.mozilla.org/en-US/docs/Web/CSS/overflow
   * [2]: https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollTop
   */
  function handleScroll(event: React.UIEvent<HTMLDivElement>) {
    (event.currentTarget as any).scrollTop = 0;
  }

  return (
    <View style={styles.container} onScroll={handleScroll}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    overflow: "hidden",
  },
});
