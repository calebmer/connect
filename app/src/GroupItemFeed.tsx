import {BodyText, Font} from "./atoms";
import {GroupItem} from "./GroupItem";
import {PostCache} from "./cache/entities/PostCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {StyleSheet} from "react-native";
import {useCacheData} from "./cache/Cache";
import {calebMeredith} from "./MockData";

export function GroupItemFeed({postID}: {postID: PostID}) {
  const post = useCacheData(PostCache, postID);
  return (
    <GroupItem account={calebMeredith}>
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
