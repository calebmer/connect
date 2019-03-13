import {BodyText, Font} from "./atoms";
import {GroupItem} from "./GroupItem";
import {InboxItem} from "./MockData";
import React from "react";
import {StyleSheet} from "react-native";

export function GroupItemInbox({item}: {item: InboxItem}) {
  return (
    <GroupItem account={item.author}>
      <BodyText style={styles.text} numberOfLines={2}>
        {item.contentPreview}
      </BodyText>
    </GroupItem>
  );
}

const styles = StyleSheet.create({
  text: {
    maxHeight: Font.size2.lineHeight * 2,
  },
});
