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

export function PostEditorModal() {
  // Is this component minimized?
  const [animateMinimized, setAnimateMinimized] = useState(false);
  const [minimized, setMinimized] = useState(animateMinimized);

  // When mounting this component, it starts offscreen. Then, in an effect, we
  // animate the component into view with a spring model.
  const translateY = useConstant(
    () => new Animated.Value(PostEditorModal.height),
  );

  useEffect(() => {
    // What value should we animated to?
    let toValue;

    // If the modal is currently minimized then animate it so that the title bar
    // still shows but no other part of the editor.
    if (animateMinimized) {
      toValue = PostEditorModal.height - TitleBar.height;
    }
    // Otherwise, animate until we have fully opened the modal.
    else {
      toValue = 0;
    }

    // Declare the spring animation which will shrink or grow our modal.
    const animation = Animated.spring(translateY, {
      toValue,
      friction: 10,
      tension: 28,
      overshootClamping: true,
      useNativeDriver: Platform.OS !== "web",
    });

    // Run the animation! Update the actual props when we are done.
    animation.start();

    // After a bit, update our actual state using the animation state. We do
    // this in a timeout since spring animations may take a while to complete.
    const timeoutID = setTimeout(() => {
      setMinimized(animateMinimized);
    }, 200);

    return () => {
      animation.stop();
      clearTimeout(timeoutID);
    };
  }, [animateMinimized, translateY]);

  return (
    <Animated.View style={[styles.modal, {transform: [{translateY}]}]}>
      <TitleBar
        minimized={minimized}
        onMinimizeToggle={() => setAnimateMinimized(minimized => !minimized)}
        onClose={() => {}}
      />
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

PostEditorModal.height = Space.space15;

const styles = StyleSheet.create({
  modal: {
    position: "absolute",
    bottom: 0,
    right: Space.space7,
    overflow: "hidden",
    width: Font.maxWidth,
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
});
