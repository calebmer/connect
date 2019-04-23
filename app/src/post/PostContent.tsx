import {BodyText, LabelText, MetaText, Space} from "../atoms";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "../account/AccountAvatar";
import {AccountCache} from "../account/AccountCache";
import {PostCache} from "./PostCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {communicateTime} from "../utils/communicateTime";
import {postMaxWidth} from "./postMaxWidth";
import {useCacheData} from "../cache/Cache";

export function PostContent({postID}: {postID: PostID}) {
  const {post} = useCacheData(PostCache, postID);
  const author = useCacheData(AccountCache, post.authorID);

  // NOTE: `new Date()` is a side-effect in render! Ideally we would use
  // `useEffect()` to watch for when the time changes, but this is good enough
  // for now.
  const publishedAt = communicateTime(new Date(), new Date(post.publishedAt));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AccountAvatar account={author} />
        <View style={styles.byline}>
          <LabelText>{author.name}</LabelText>
          <MetaText>{publishedAt}</MetaText>
        </View>
      </View>
      <View style={styles.content}>
        <BodyText selectable>{post.content}</BodyText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    // maxWidth: postMaxWidth,
  },
  header: {
    flexDirection: "row",
    padding: Space.space3,
    paddingBottom: Space.space2,
  },
  byline: {
    paddingLeft: Space.space3,
  },
  content: {
    paddingBottom: Space.space3,
    paddingHorizontal: Space.space3,
  },
});
