import {StyleSheet, View} from "react-native";
import {Comment} from "./Comment";
import {CommentCacheList} from "./cache/CommentCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {Space} from "./atoms";
import {useCacheData} from "./cache/framework/Cache";
import {useCacheListData} from "./cache/framework/CacheList";

export function PostComments({postID}: {postID: PostID}) {
  return (
    // TODO: An actual fallback...
    <React.Suspense fallback={null}>
      <PostCommentsSuspense postID={postID} />
    </React.Suspense>
  );
}

function PostCommentsSuspense({postID}: {postID: PostID}) {
  const commentCacheList = useCacheData(CommentCacheList, postID);
  const {items: comments} = useCacheListData(commentCacheList);
  return (
    <View style={styles.container}>
      {comments.map((comment, i) => (
        <Comment
          key={comment.id}
          commentID={comment.id}
          lastCommentID={i > 0 ? comments[i - 1].id : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    maxWidth: Space.space15,
    paddingBottom: Space.space3,
  },
});
