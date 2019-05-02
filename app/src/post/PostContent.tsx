import {BodyText, LabelText, MetaText, Space} from "../atoms";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "../account/AccountAvatar";
import {AccountCache} from "../account/AccountCache";
import {PostCache} from "./PostCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {Trough} from "../molecules/Trough";
import {communicateTime} from "../utils/communicateTime";
import {useCache} from "../cache/Cache";

function PostContent({postID}: {postID: PostID}) {
  const {post} = useCache(PostCache, postID);
  const author = useCache(AccountCache, post.authorID);

  // NOTE: `new Date()` is a side-effect in render! Ideally we would use
  // `useEffect()` to watch for when the time changes, but this is good enough
  // for now.
  const publishedAt = communicateTime(new Date(), new Date(post.publishedAt));

  return (
    <>
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
      <Trough title="Comments" />
    </>
  );
}

const _PostContent = React.memo(PostContent);
export {_PostContent as PostContent};

const styles = StyleSheet.create({
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
