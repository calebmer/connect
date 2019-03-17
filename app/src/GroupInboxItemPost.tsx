import {BodyText, Font} from "./atoms";
import {GroupInboxItemLayout} from "./GroupInboxItemLayout";
import {Post} from "./MockData";
import React from "react";
import {StyleSheet} from "react-native";

export function GroupInboxItemPost({post}: {post: Post}) {
  return (
    <GroupInboxItemLayout account={post.author}>
      <BodyText style={styles.text} numberOfLines={2}>
        {post.content}
      </BodyText>
    </GroupInboxItemLayout>
  );
}

const styles = StyleSheet.create({
  text: {
    maxHeight: Font.size2.lineHeight * 2,
  },
});
