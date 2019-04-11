import {
  Animated,
  Platform,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import {Border, Color, Font, Icon, IconName, Shadow, Space} from "./atoms";
import React, {useEffect, useState} from "react";
import {useConstant} from "./useConstant";

export function PostNewPopup({onClose}: {onClose: () => void}) {
  // Is this component minimized?
  const [minimized, setMinimized] = useState({state: false, animating: false});

  // Are we closing the editor?
  const [closing, setClosing] = useState(false);

  // When mounting this component, it starts offscreen. Then, in an effect, we
  // animate the component into view with a spring model.
  const translateY = useConstant(() => new Animated.Value(PostNewPopup.height));

  useEffect(() => {
    // Declare the spring animation which will shrink or grow our editor.
    const animation = Animated.spring(translateY, {
      toValue:
        // If we are closing the editor then animate it all the way until it
        // is gone.
        closing
          ? PostNewPopup.height
          : // If the editor is currently minimized then animate it so that the
          // title bar still shows but no other part of the editor.
          minimized.state
          ? PostNewPopup.height - TitleBar.height
          : // Otherwise, animate until we have fully opened the editor.
            0,

      friction: 10,
      tension: 55,
      overshootClamping: true,
      useNativeDriver: Platform.OS !== "web",
    });

    // When we call `animation.stop()` the animation “done” callback will run.
    // Use this variable to detect when the animation was explicitly stopped.
    let stopped = false;

    // Run the animation! Update the actual props when we are done.
    animation.start(() => {
      // If we were closing then make sure to call our `onClose` prop!
      if (closing) {
        onClose();
      }

      if (!stopped) {
        // If we are animating `minimized` then set `animating` to false.
        // Otherwise don’t update the state.
        setMinimized(minimized => {
          if (minimized.animating === true) {
            return {state: minimized.state, animating: false};
          } else {
            return minimized;
          }
        });
      }
    });

    return () => {
      stopped = true;
      animation.stop();
    };
  }, [closing, minimized, onClose, translateY]);

  // If we are animating `minimized` then interpolate the width based
  // on `translateY`.
  const width = minimized.animating
    ? translateY.interpolate({
        inputRange: [0, PostNewPopup.height - TitleBar.height],
        outputRange: [PostNewPopup.width, PostNewPopup.minimizedWidth],
      })
    : // If we are not animating `minimized` then width is a constant. Note that
    // this includes all animations that are not specifically an animation
    // on `minimized`!
    minimized.state
    ? PostNewPopup.minimizedWidth
    : PostNewPopup.width;

  return (
    <Animated.View
      style={[styles.container, {width, transform: [{translateY}]}]}
    >
      <TitleBar
        minimized={minimized.state}
        onMinimizeToggle={() => {
          setMinimized(minimized => ({
            state: !minimized.state,
            animating: true,
          }));
        }}
        onClose={() => setClosing(true)}
      />
      <View style={styles.content} />
    </Animated.View>
  );
}

function TitleBar({
  minimized,
  onMinimizeToggle,
  onClose,
}: {
  minimized: boolean;
  onMinimizeToggle: () => void;
  onClose: () => void;
}) {
  return (
    <TouchableWithoutFeedback
      disabled={!minimized}
      accessible={false}
      onPress={onMinimizeToggle}
    >
      <View style={styles.titleBar}>
        <Text style={styles.title} selectable={false} numberOfLines={1}>
          New Post
        </Text>
        <View style={styles.titleBarButtons}>
          <TitleBarButton
            icon={minimized ? "chevron-up" : "chevron-down"}
            onPress={onMinimizeToggle}
          />
          <TitleBarButton icon="x" onPress={onClose} />
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}

function TitleBarButton({
  icon,
  onPress,
}: {
  icon: IconName;
  onPress: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <TouchableWithoutFeedback
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onPress={onPress}
    >
      {/* We need the <View> because <TouchableWithoutFeedback> works by calling
          `React.cloneElement()` with the correct props. */}
      <View
        style={[styles.titleBarButton, hovered && styles.titleBarButtonHovered]}
        accessibilityRole="button"
      >
        <Icon name={icon} color={hovered ? Color.white : Color.grey2} />
      </View>
    </TouchableWithoutFeedback>
  );
}

TitleBar.height = Font.size1.fontSize + Space.space2 * 2;

PostNewPopup.width = Font.maxWidth;
PostNewPopup.height = Space.space15;

PostNewPopup.minimizedWidth = Space.space12;

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    right: Space.space6,
    overflow: "hidden",
    width: PostNewPopup.width,
    height: PostNewPopup.height,
    borderTopLeftRadius: Border.radius1,
    borderTopRightRadius: Border.radius1,
    backgroundColor: Color.white,
    ...Shadow.elevation4,
  },
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    height: TitleBar.height,
    backgroundColor: Color.grey7,
  },
  title: {
    padding: Space.space2,
    color: Color.grey0,
    ...Font.sans,
    ...Font.size1,
    lineHeight: Font.size1.fontSize,
  },
  titleBarButtons: {
    flexDirection: "row",
    paddingHorizontal: Space.space2 - Space.space0,
  },
  titleBarButton: {
    padding: Space.space0 / 2,
    margin: Space.space0 / 2,
    borderRadius: 100,
  },
  titleBarButtonHovered: {
    backgroundColor: Color.grey5,
  },
  content: {
    width: PostNewPopup.width,
  },
});
