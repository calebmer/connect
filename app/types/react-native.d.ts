// Use TypeScript [declaration merging][1] to modify the types of `react-native`
// so that we can support props available on web.
//
// [1]: https://www.typescriptlang.org/docs/handbook/declaration-merging.html

import "react-native";

declare module "react-native" {
  interface TextProps {
    /**
     * Controls whether the `Text` can be the target of touch events.
     *
     * - `auto`: The text can be the target of touch events.
     * - `none`: The text is never the target of touch events.
     * - `box-none`: The text is never the target of touch events but it's
     *   subviews can be.
     */
    pointerEvents?: "box-none" | "none" | "box-only" | "auto";
  }

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

    /**
     * The focus event fires when an element has received focus.
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/focus_event
     */
    onFocus?: () => void;

    /**
     * The blur event fires when an element has lost focus.
     *
     * https://developer.mozilla.org/en-US/docs/Web/API/Element/blur_event
     */
    onBlur?: () => void;
  }

  interface ScrollViewProps {
    /**
     * Pins the currently scrolled window to either the top of its content or
     * the bottom. The default behavior is "top". That means when the content in
     * the scroll view changes we will keep the offset of the scroll view from
     * the top of the content the same. If we set this prop to "bottom" then
     * when the content of the scroll view changes we will keep the offset from
     * the bottom of the content the same.
     */
    pinWindowTo?: "top" | "bottom";
  }

  export type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;
}
