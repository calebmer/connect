import {ScrollEvent} from "react-native";

/**
 * iOS has the concept of [`contentInset`][1] which represents the space between
 * the content of a scroll view and the edges of the scroll view. iOS also has
 * [`adjustedContentInset`][2] which includes the safe area at the top and
 * bottom of a screen.
 *
 * Other platforms like web and Android do not have a concept of content inset.
 *
 * [1]: https://developer.apple.com/documentation/uikit/uiscrollview/1619406-contentinset?language=objc
 * [2]: https://developer.apple.com/documentation/uikit/uiscrollview/2902259-adjustedcontentinset?language=objc
 */
export function getAdjustedContentInsetTop(event: ScrollEvent): number {
  if ((event as any).nativeEvent.adjustedContentInset) {
    return (event as any).nativeEvent.adjustedContentInset.top;
  } else if (event.nativeEvent.contentInset) {
    return event.nativeEvent.contentInset.top;
  } else {
    return 0;
  }
}
