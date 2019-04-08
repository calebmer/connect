import {Border, Color, Icon, Space} from "./atoms";
import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import React, {ReactNode, useContext, useState} from "react";
import {StyleSheet, TouchableWithoutFeedback, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";

export function GroupItem({
  account,
  selected,
  onSelect,
  children,
}: {
  account: AccountProfile;
  selected?: boolean;
  onSelect?: () => void;
  children: ReactNode;
}) {
  const [isPressed, setIsPressed] = useState(false);
  const isLaptop =
    useContext(GroupHomeLayoutContext) === GroupHomeLayout.Laptop;

  function handleSelect() {
    if (!selected && onSelect) {
      onSelect();
    }
  }

  return (
    <TouchableWithoutFeedback
      onPress={handleSelect}
      onPressIn={() => setIsPressed(true)}
      onPressOut={() => setIsPressed(false)}
    >
      <View
        style={[
          styles.container,
          (selected || isPressed) && [
            styles.containerSelected,
            isLaptop && styles.containerSelectedLaptop,
          ],
        ]}
        accessible
        accessibilityLabel={`Preview of a post by ${account.name}.`}
        accessibilityHint={`Navigates to the full post by ${account.name}.`}
        accessibilityRole="button"
        accessibilityStates={selected ? ["selected"] : []}
      >
        <AccountAvatar account={account} />
        <View style={styles.body}>{children}</View>
        {!isLaptop && (
          <View style={styles.icon}>
            <Icon name="chevron-right" color={Color.grey4} />
          </View>
        )}
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
  containerSelectedLaptop: {
    borderRightColor: Color.yellow4,
  },
  body: {
    flex: 1,
    paddingHorizontal: GroupItem.padding,
  },
  icon: {
    justifyContent: "center",
  },
});
