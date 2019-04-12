import {Border, Color, Icon, Space} from "./atoms";
import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import React, {useContext, useState} from "react";
import {StyleSheet, TouchableWithoutFeedback, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountProfile} from "@connect/api-client";

export function GroupItem({
  account,
  active: _active,
  selected,
  onSelect,
  children,
}: {
  /**
   * The profile who authored the content in this group item.
   */
  account: AccountProfile;

  /**
   * The item is currently activated, but not selected. It could be pressed or
   * focused, for instance.
   */
  active?: boolean;

  /**
   * The item is currently selected. There can only be one selected item at a
   * time in our application.
   */
  selected?: boolean;

  /**
   * The item was selected by a press event or keyboard event.
   */
  onSelect?: () => void;

  /**
   * The body content of our group item to the right of the item’s
   * account avatar.
   */
  children: React.Node;
}) {
  // Is this component pressed?
  const [pressed, setPressed] = useState(false);

  // This component is active when it is pressed. Not just when it’s parent
  // passes the active prop.
  const active = _active || pressed;

  // Are we on the laptop `<GroupHome>` layout?
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
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
    >
      <View
        style={[
          styles.container,
          active && styles.containerActive,
          selected && styles.containerSelected,
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
  containerActive: {
    backgroundColor: Color.yellow0,
    borderRightColor: Color.yellow0,
  },
  containerSelected: {
    backgroundColor: Color.yellow0,
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
