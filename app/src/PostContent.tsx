import {BodyText, LabelText, MetaText, Space} from "./atoms";
import {Breakpoint, useBreakpoint} from "./useBreakpoint";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountCache} from "./cache/AccountCache";
import {PostCache} from "./cache/PostCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {communicateTime} from "./communicateTime";
import {useCacheData} from "./cache/framework/Cache";

export function PostContent({postID}: {postID: PostID}) {
  const post = useCacheData(PostCache, postID);
  const author = useCacheData(AccountCache, post.authorID);

  const breakpoint = useBreakpoint();
  const indentContent = breakpoint >= Breakpoint.LaptopLarge;

  // NOTE: `new Date()` is a side-effect in render! Ideally we would use
  // `useEffect()` to watch for when the time changes, but this is good enough
  // for now.
  const publishedAt = communicateTime(new Date(), new Date(post.publishedAt));

  return (
    <>
      <View
        style={[styles.header, indentContent && styles.headerIndentContent]}
      >
        <AccountAvatar account={author} />
        <View style={styles.headerInfo}>
          <LabelText>{author.name}</LabelText>
          <MetaText>{publishedAt}</MetaText>
        </View>
      </View>
      <View
        style={[styles.postContent, indentContent && styles.postContentIndent]}
      >
        <BodyText>{post.content}</BodyText>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    paddingBottom: Space.space3,
  },
  headerIndentContent: {
    paddingBottom: Space.space1,
  },
  headerInfo: {
    paddingLeft: Space.space3,
  },
  postContent: {
    maxWidth: Space.space15 - Space.space3 * 2,
  },
  postContentIndent: {
    marginLeft: AccountAvatar.size + Space.space3,
  },
});
