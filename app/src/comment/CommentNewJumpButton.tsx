import {Border, Color, Font, Icon, Space} from "../atoms";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React from "react";

export function CommentNewJumpButton({
  scrollViewRef,
}: {
  scrollViewRef: React.RefObject<ScrollView>;
}) {
  return (
    <TouchableOpacity
      onPress={() => {
        if (scrollViewRef.current) {
          scrollViewRef.current.scrollToEnd({animated: true});
        }
      }}
    >
      <View style={styles.button}>
        <Icon
          name="arrow-down"
          color={Color.yellow8}
          size={Font.size1.fontSize}
        />
        <Text style={styles.label}>latest</Text>
      </View>
    </TouchableOpacity>
  );
}

CommentNewJumpButton.height = Font.size1.lineHeight + Space.space0;

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
