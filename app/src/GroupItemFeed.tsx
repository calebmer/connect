import {BodyText, Font} from "./atoms";
import {GroupItem} from "./GroupItem";
import {Post} from "./MockData";
import React from "react";
import {StyleSheet} from "react-native";

export function GroupItemFeed({post}: {post: Post}) {
  return (
    <GroupItem account={post.author}>
      <BodyText style={styles.text} numberOfLines={2}>
        {post.content}
      </BodyText>
    </GroupItem>
  );
}

const styles = StyleSheet.create({
  text: {
    maxHeight: Font.size2.lineHeight * 2,
  },
});
