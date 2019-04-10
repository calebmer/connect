import {Border, Color, Font, Icon, IconName, Shadow, Space} from "./atoms";
import React, {useState} from "react";
import {StyleSheet, Text, TouchableWithoutFeedback, View} from "react-native";

export function PostEditorModal({visible}: {visible: boolean}) {
  return (
    <View style={styles.container}>
      {visible && (
        <View style={styles.modal}>
          <TitleBar />
        </View>
      )}
    </View>
  );
}

function TitleBar() {
  return (
    <View style={styles.titleBar}>
      <Text style={styles.title} selectable={false} numberOfLines={1}>
        New Post
      </Text>
      <View style={styles.titleBarButtons}>
        <TitleBarButton icon="minus" />
        <TitleBarButton icon="x" />
      </View>
    </View>
  );
}

function TitleBarButton({icon}: {icon: IconName}) {
  const [hovered, setHovered] = useState(false);

  return (
    <TouchableWithoutFeedback
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
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

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    right: Space.space7,
  },
  modal: {
    overflow: "hidden",
    width: Font.maxWidth,
    minHeight: Space.space15,
    borderTopLeftRadius: Border.radius1,
    borderTopRightRadius: Border.radius1,
    backgroundColor: Color.white,
    ...Shadow.elevation4,
  },
  titleBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
