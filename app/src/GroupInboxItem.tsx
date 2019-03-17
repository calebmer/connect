import {BodyText, Font} from "./atoms";
import {GroupInboxItemLayout} from "./GroupInboxItemLayout";
import {InboxItem} from "./MockData";
import React from "react";
import {StyleSheet} from "react-native";

export function GroupInboxItem({item}: {item: InboxItem}) {
  return (
    <GroupInboxItemLayout account={item.author}>
      <BodyText style={styles.text} numberOfLines={2}>
        {item.contentPreview}
      </BodyText>
    </GroupInboxItemLayout>
  );
}

const styles = StyleSheet.create({
  text: {
    maxHeight: Font.size2.lineHeight * 2,
  },
});
