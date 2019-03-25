import {BodyText, LabelText, MetaText, Space} from "./atoms";
import {ScrollView, StyleSheet, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountCache} from "./cache/AccountCache";
import {PostCache} from "./cache/PostCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {communicateTime} from "./communicateTime";
import {useCacheData} from "./cache/framework/Cache";

// TODO:
//
// 1. Simple post rendering
// 2. Native navbar
// 3. Web inbox

export function Post({postID: _postID}: {postID: string}) {
  const postID = parseInt(_postID, 10) as PostID;

  const post = useCacheData(PostCache, postID);
  const author = useCacheData(AccountCache, post.authorID);

  // NOTE: `new Date()` is a side-effect in render! Ideally we would use
  // `useEffect()` to watch for when the time changes, but this is good enough
  // for now.
  const publishedAt = communicateTime(new Date(), new Date(post.publishedAt));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <AccountAvatar account={author} />
        <View style={styles.headerInfo}>
          <LabelText>{author.name}</LabelText>
          <MetaText>{publishedAt}</MetaText>
        </View>
      </View>
      <View style={styles.content}>
        <BodyText>{post.content}</BodyText>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Space.space3,
  },
  header: {
    flexDirection: "row",
    paddingBottom: Space.space3,
  },
  headerInfo: {
    paddingLeft: Space.space3,
  },
  content: {
    maxWidth: Space.space14,
  },
});
