import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} from "react-native";
import {Border, Color, Font, Icon, Space} from "../atoms";
import React from "react";
import {useAnimatedSpring} from "../utils/useAnimatedValue";

export function CommentNewJumpButton({
  show,
  scrollViewRef,
}: {
  show: boolean;
  scrollViewRef: React.RefObject<ScrollView>;
}) {
  const translateY = useAnimatedSpring(
    show ? 0 : CommentNewJumpButton.fullHeight + 10,
    {tension: 100, friction: 7},
  );

  return (
    <TouchableWithoutFeedback
      onPress={() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({animated: false});
        }
      }}
    >
      <Animated.View style={[styles.button, {transform: [{translateY}]}]}>
        <Icon
          name="arrow-down"
          color={Color.yellow8}
          size={Font.size1.fontSize}
        />
        <Text style={styles.label}>latest</Text>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
}

CommentNewJumpButton.height = Font.size1.lineHeight + Space.space0;
CommentNewJumpButton.marginBottom = Space.space2;

CommentNewJumpButton.fullHeight =
  CommentNewJumpButton.height + CommentNewJumpButton.marginBottom;

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Space.space2,
    paddingVertical: Space.space0 / 2,
    borderRadius: Border.radius2,
    backgroundColor: Color.yellow2,
  },
  label: {
    marginLeft: Space.space0,
    color: Color.yellow8,
    ...Font.sans,
    ...Font.size1,
  },
});
