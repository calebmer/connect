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

export function PostEditorModal({onClose}: {onClose: () => void}) {
  // Is this component minimized?
  const [minimized, setMinimized] = useState({state: false, animating: false});

  // Are we closing the modal?
  const [closing, setClosing] = useState(false);

  // When mounting this component, it starts offscreen. Then, in an effect, we
  // animate the component into view with a spring model.
  const translateY = useConstant(
    () => new Animated.Value(PostEditorModal.height),
  );

  useEffect(() => {
    // Declare the spring animation which will shrink or grow our modal.
    const animation = Animated.spring(translateY, {
      toValue:
        // If we are closing the modal then animate it all the way until it
        // is gone.
        closing
          ? PostEditorModal.height
          : // If the modal is currently minimized then animate it so that the
          // title bar still shows but no other part of the editor.
          minimized.state
          ? PostEditorModal.height - TitleBar.height
          : // Otherwise, animate until we have fully opened the modal.
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
        inputRange: [0, PostEditorModal.height - TitleBar.height],
        outputRange: [PostEditorModal.width, PostEditorModal.minimizedWidth],
      })
    : // If we are not animating `minimized` then width is a constant. Note that
    // this includes all animations that are not specifically an animation
    // on `minimized`!
    minimized.state
    ? PostEditorModal.minimizedWidth
    : PostEditorModal.width;

  return (
    <Animated.View style={[styles.modal, {width, transform: [{translateY}]}]}>
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
    <TouchableWithoutFeedback onPress={onMinimizeToggle}>
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
      >
        <Icon name={icon} color={hovered ? Color.white : Color.grey2} />
      </View>
    </TouchableWithoutFeedback>
  );
}

TitleBar.height = Font.size1.fontSize + Space.space2 * 2;

PostEditorModal.width = Font.maxWidth;
PostEditorModal.height = Space.space15;

PostEditorModal.minimizedWidth = Space.space11;

const styles = StyleSheet.create({
  modal: {
    position: "absolute",
    bottom: 0,
    right: Space.space6,
    overflow: "hidden",
    width: PostEditorModal.width,
    height: PostEditorModal.height,
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
    width: PostEditorModal.width,
  },
});
