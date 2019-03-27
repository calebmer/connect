import {Border, Color, Space} from "./atoms";
import {
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import React, {ReactNode, useState} from "react";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";

export function GroupItem({
  account,
  selected,
  onPress,
  children,
}: {
  account: AccountProfile;
  selected?: boolean;
  onPress?: () => void;
  children: ReactNode;
}) {
  const [isPressed, setIsPressed] = useState(false);

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <View
        style={[
          styles.container,
          (selected || isPressed) && styles.containerSelected,
        ]}
      >
        <AccountAvatar account={account} />
        <View style={styles.body}>{children}</View>
      </View>
    </TouchableWithoutFeedback>
  );
}

GroupItem.padding = Space.space3;
GroupItem.backgroundColor = Color.white;

const borderWidth = Border.width3;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: "row",
    padding: GroupItem.padding,
    paddingRight: GroupItem.padding - borderWidth,
    backgroundColor: GroupItem.backgroundColor,
    borderRightWidth: borderWidth,
    borderRightColor: GroupItem.backgroundColor,
  },
  containerSelected: {
    backgroundColor: Color.yellow0,
    borderRightColor: Platform.OS === "web" ? Color.yellow4 : Color.yellow0,
  },
  body: {
    flex: 1,
    paddingHorizontal: GroupItem.padding,
  },
});
