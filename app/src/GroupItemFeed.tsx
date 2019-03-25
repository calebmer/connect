import {BodyText, Font, LabelText, MetaText, Space} from "./atoms";
import {Platform, StyleSheet, View} from "react-native";
import {AccountCache} from "./cache/AccountCache";
import {GroupItem} from "./GroupItem";
import {PostCache} from "./cache/PostCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {communicateTime} from "./communicateTime";
import {useCacheData} from "./cache/framework/Cache";

function GroupItemFeed({postID}: {postID: PostID}) {
  // TODO: Suspense handler for _just_ this component.
  const post = useCacheData(PostCache, postID);
  const account = useCacheData(AccountCache, post.authorID);

  // NOTE: It’s a side-effect to call `new Date()` in render! Ideally, we would
  // have a hook that subscribes to the system time and re-renders this
  // component when it changes. At the moment, it’s not a big issue. This
  // component is memoized anyway so the current date only changes when
  // the props change.
  const publishedAt = communicateTime(new Date(), new Date(post.publishedAt));

  return (
    <GroupItem account={account}>
      <View style={styles.header}>
        <LabelText>{account.name}</LabelText>
        <MetaText style={styles.publishedAt}>{publishedAt}</MetaText>
      </View>
      <BodyText style={styles.text} numberOfLines={numberOfLines}>
        {post.content}
      </BodyText>
    </GroupItem>
  );
}

const _GroupItemFeed = React.memo(GroupItemFeed);
export {_GroupItemFeed as GroupItemFeed};

const numberOfLines = 8;

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: Platform.OS === "web" ? "baseline" : undefined,
  },
  publishedAt: {
    paddingLeft: Space.space0,
    ...Platform.select({
      web: {},
      default: {
        // NOTE: Manually align to the baseline since `alignItems: "baseline"`
        // doesn’t do it.
        bottom: -2.5,
      },
    }),
  },
  text: {
    maxHeight: Font.size2.lineHeight * numberOfLines,
  },
});
