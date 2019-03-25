import {BodyText, Font, LabelText} from "./atoms";
import {AccountCache} from "./cache/AccountCache";
import {GroupItem} from "./GroupItem";
import {PostCache} from "./cache/PostCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {StyleSheet} from "react-native";
import {useCacheData} from "./cache/framework/Cache";

function GroupItemFeed({postID}: {postID: PostID}) {
  // TODO: Suspense handler for _just_ this component.
  const post = useCacheData(PostCache, postID);
  const account = useCacheData(AccountCache, post.authorID);
  return (
    <GroupItem account={account}>
      <BodyText style={styles.text} numberOfLines={numberOfLines}>
        <LabelText>
          {account.name}
          {"\n"}
        </LabelText>
        {post.content}
      </BodyText>
    </GroupItem>
  );
}

const _GroupItemFeed = React.memo(GroupItemFeed);
export {_GroupItemFeed as GroupItemFeed};

const numberOfLines = 8;

const styles = StyleSheet.create({
  text: {
    maxHeight: Font.size2.lineHeight * numberOfLines,
  },
});
