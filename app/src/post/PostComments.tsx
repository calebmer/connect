import {StyleSheet, View} from "react-native";
import {Comment} from "../comment/Comment";
import {CommentCacheList} from "../comment/CommentCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {Space} from "../atoms";
import {postMaxWidth} from "./postMaxWidth";
import {useCacheData} from "../cache/Cache";
import {useCacheListData} from "../cache/CacheList";

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
    maxWidth: postMaxWidth,
    paddingBottom: Space.space3,
  },
});
