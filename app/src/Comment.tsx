import {BodyText, Space} from "./atoms";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountByline} from "./AccountByline";
import {AccountCache} from "./cache/AccountCache";
import {CommentCache} from "./cache/CommentCache";
import {CommentID} from "@connect/api-client";
import React from "react";
import {useCacheData} from "./cache/framework/Cache";

export function Comment({commentID}: {commentID: CommentID}) {
  const comment = useCacheData(CommentCache, commentID);
  const author = useCacheData(AccountCache, comment.authorID);

  return (
    <View style={styles.comment}>
      <AccountAvatar account={author} />
      <View style={styles.body}>
        <AccountByline account={author} time={comment.postedAt} />
        <BodyText>{comment.content}</BodyText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  comment: {
    flexDirection: "row",
    padding: Space.space3,
  },
  body: {
    flex: 1,
    paddingLeft: Space.space3,
  },
});
