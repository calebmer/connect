import {Border, Color, Space} from "./atoms";
import React, {ReactNode, useState} from "react";
import {StyleSheet, TouchableWithoutFeedback, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";
import {useGroupHomeLayeredContext} from "./GroupHome";

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
  const isGroupHomeLayered = useGroupHomeLayeredContext();

  return (
    <TouchableWithoutFeedback
      onPress={onPress}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <View
        style={[
          styles.container,
          (selected || isPressed) && [
            styles.containerSelected,
            isGroupHomeLayered && styles.containerSelectedLayered,
          ],
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
    borderRightColor: Color.yellow0,
  },
  containerSelectedLayered: {
    borderRightColor: Color.yellow4,
  },
  body: {
    flex: 1,
    paddingHorizontal: GroupItem.padding,
  },
});
