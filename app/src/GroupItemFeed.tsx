import {BodyText, Font} from "./atoms";
import {AccountCache} from "./cache/entities/AccountCache";
import {GroupItem} from "./GroupItem";
import {PostCache} from "./cache/entities/PostCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {StyleSheet} from "react-native";
import {useCacheData} from "./cache/Cache";

function GroupItemFeed({postID}: {postID: PostID}) {
  // TODO: Suspense handler for _just_ this component.
  const post = useCacheData(PostCache, postID);
  const account = useCacheData(AccountCache, post.authorID);
  return (
    <GroupItem account={account}>
      <BodyText style={styles.text} numberOfLines={2}>
        {post.content}
      </BodyText>
    </GroupItem>
  );
}

const _GroupItemFeed = React.memo(GroupItemFeed);
export {_GroupItemFeed as GroupItemFeed};

const styles = StyleSheet.create({
  text: {
    maxHeight: Font.size2.lineHeight * 2,
  },
});
