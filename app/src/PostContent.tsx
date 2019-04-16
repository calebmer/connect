import {BodyText, Font, LabelText, MetaText, Space} from "./atoms";
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
  const {post} = useCacheData(PostCache, postID);
  const author = useCacheData(AccountCache, post.authorID);

  const breakpoint = useBreakpoint();
  const indentContent = breakpoint >= Breakpoint.LaptopLarge;

  // NOTE: `new Date()` is a side-effect in render! Ideally we would use
  // `useEffect()` to watch for when the time changes, but this is good enough
  // for now.
  const publishedAt = communicateTime(new Date(), new Date(post.publishedAt));

  return (
    <View style={styles.container}>
      <View
        style={[styles.header, indentContent && styles.headerIndentContent]}
      >
        <AccountAvatar account={author} />
        <View style={styles.byline}>
          <LabelText>{author.name}</LabelText>
          <MetaText>{publishedAt}</MetaText>
        </View>
      </View>
      <View style={[styles.content, indentContent && styles.indentContent]}>
        <BodyText>{post.content}</BodyText>
      </View>
    </View>
  );
}

const indentContentWidth = Space.space3 + AccountAvatar.size + Space.space3;

PostContent.maxWidth = Font.maxWidth + indentContentWidth;

const styles = StyleSheet.create({
  container: {
    maxWidth: PostContent.maxWidth,
  },
  header: {
    flexDirection: "row",
    padding: Space.space3,
    paddingBottom: Space.space2,
  },
  headerIndentContent: {
    paddingBottom: Space.space0,
  },
  byline: {
    paddingLeft: Space.space3,
  },
  content: {
    paddingBottom: Space.space3,
    paddingHorizontal: Space.space3,
  },
  indentContent: {
    paddingLeft: indentContentWidth,
  },
});
