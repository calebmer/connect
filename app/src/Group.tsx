import {
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import React, {useState} from "react";
import {Color} from "./atoms";
import {GroupBanner} from "./GroupBanner";
import {GroupPostPrompt} from "./GroupPostPrompt";

export function Group() {
  // On iOS you can scroll up which results in a negative value for `scrollY`.
  // When that happens we want to scale up our group banner so that it
  // fills in the extra space. That’s what the `bannerScale` value is for. It
  // translates a negative scroll offset into a scale transformation.
  //
  // There’s some weirdness on iOS where where `scrollY` starts at some negative
  // value like -44 on an iPhone X instead of 0, so we record the first value of
  // `scrollY` and use it as an offset.
  const [scrollY] = useState(new Animated.Value(0));
  const [offsetScrollY, setOffsetScrollY] = useState<null | number>(null);
  const bannerScale =
    offsetScrollY === null
      ? 1
      : scrollY.interpolate({
          inputRange: [-GroupBanner.height, 0].map(y => y + offsetScrollY),
          outputRange: [2.7, 1], // NOTE: I would expect this number to be 2 and not 2.7, but experimental evidence proves otherwise.
          extrapolateLeft: "extend",
          extrapolateRight: "clamp",
        });

  return (
    <View style={styles.container}>
      <Animated.View
        // TODO: Scale background only instead of background and text? Only do
        // this when we have a background image to test against.
        style={[styles.banner, {transform: [{scale: bannerScale}]}]}
      >
        <GroupBanner />
      </Animated.View>
      <Animated.ScrollView
        scrollEventThrottle={16}
        onScrollBeginDrag={(event: NativeSyntheticEvent<NativeScrollEvent>) => {
          if (offsetScrollY === null) {
            setOffsetScrollY(event.nativeEvent.contentOffset.y);
          }
        }}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {useNativeDriver: Platform.OS !== "web"},
        )}
      >
        <View style={styles.content}>
          <GroupPostPrompt />
          <View style={{height: 1000}} />
          <GroupPostPrompt />
        </View>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    flex: 1,
    position: "relative",
    width: "100%",
    maxWidth: GroupBanner.maxWidth,
    backgroundColor: Color.grey1,
  },
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  content: {
    marginTop: GroupBanner.height,
    backgroundColor: Color.grey1,
  },
});
