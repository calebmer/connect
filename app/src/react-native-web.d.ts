// Use TypeScript [declaration merging][1] to modify the types of `react-native`
// so that we can support props available on web.
//
// [1]: https://www.typescriptlang.org/docs/handbook/declaration-merging.html

import "react-native";

declare module "react-native" {
  interface TouchableWithoutFeedbackProps {
    /**
     * The mouse enter event is fired when a pointing device (usually a mouse)
     * is moved over the element that has the listener attached.
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseenter_event
     */
    onMouseEnter?: () => void;

    /**
     * The mouse leave event is fired when the pointer of a pointing device
     * (usually a mouse) is moved out of an element that has the listener
     * attached to it.
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/mouseleave_event
     */
    onMouseLeave?: () => void;
  }
}