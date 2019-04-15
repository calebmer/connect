import {Animated} from "react-native";
import {useRef} from "react";

/**
 * Creates a new `Animated.Value` to be used in React Native animations. The
 * provided value will only be the initial value for our animation.
 *
 * A lot like `useConstant()` but specifically for `Animated.Value`.
 */
export function useAnimatedValue(initialValue: number): Animated.Value {
  const animatedValue = useRef<null | Animated.Value>(null);
  if (animatedValue.current === null) {
    animatedValue.current = new Animated.Value(initialValue);
  }
  return animatedValue.current;
}
