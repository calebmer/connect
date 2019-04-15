import {Animated, Platform} from "react-native";
import {useEffect, useRef} from "react";

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

/**
 * Creates an `Animated.Value` which will always be animated to the latest value
 * provided to this hook with the given configuration using a timing animation
 * from `Animated.timing()`.
 */
export function useAnimatedTiming(
  value: number,
  {
    easing,
    duration,
    delay,
    useNativeDriver = Platform.OS !== "web", // Always default to using the native driver when we aren’t on web.
  }: {
    easing?: (value: number) => number;
    duration?: number;
    delay?: number;
    useNativeDriver?: boolean;
  } = emptyObject,
): Animated.Value {
  // Get our animated value...
  const animatedValue = useAnimatedValue(value);

  // Whenever the value changes, start a new animation from our current value
  // to the new value.
  useEffect(() => {
    const animation = Animated.timing(animatedValue, {
      // The new animation value...
      toValue: value,

      // Use the provided config. Make sure to use each config item individually
      // since when they change our animation will restart!
      easing,
      duration,
      delay,
      useNativeDriver,
    });

    animation.start();
    return () => {
      animation.stop();
    };
  }, [animatedValue, delay, duration, easing, useNativeDriver, value]);

  return animatedValue;
}

/**
 * Creates an `Animated.Value` which will always be animated to the latest value
 * provided to this hook with the given configuration using a timing animation
 * from `Animated.spring()`.
 */
export function useAnimatedSpring(
  value: number,
  {
    friction,
    tension,
    useNativeDriver = Platform.OS !== "web", // Always default to using the native driver when we aren’t on web.
  }: {
    friction?: number;
    tension?: number;
    useNativeDriver?: boolean;
  } = emptyObject,
): Animated.Value {
  // Get our animated value...
  const animatedValue = useAnimatedValue(value);

  // Whenever the value changes, start a new animation from our current value
  // to the new value.
  useEffect(() => {
    const animation = Animated.spring(animatedValue, {
      // The new animation value...
      toValue: value,

      // Use the provided config. Make sure to use each config item individually
      // since when they change our animation will restart!
      friction,
      tension,
      useNativeDriver,
    });

    animation.start();
    return () => {
      animation.stop();
    };
  }, [animatedValue, friction, tension, useNativeDriver, value]);

  return animatedValue;
}

const emptyObject = {};
