import {ScrollView, StyleSheet, View} from "react-native";
import {Comment} from "../comment/Comment";
import {CommentCacheList} from "../comment/CommentCache";
import {PostID} from "@connect/api-client";
import React from "react";
import {Space} from "../atoms";
import {useCacheData} from "../cache/Cache";
import {useCacheListData} from "../cache/CacheList";

export function PostComments({
  postID,
  scrollViewRef,
}: {
  postID: PostID;
  scrollViewRef: React.RefObject<ScrollView>;
}) {
  return (
    // TODO: An actual fallback...
    <React.Suspense fallback={null}>
      <PostCommentsSuspense postID={postID} scrollViewRef={scrollViewRef} />
    </React.Suspense>
  );
}

function PostCommentsSuspense({
  postID,
  scrollViewRef,
}: {
  postID: PostID;
  scrollViewRef: React.RefObject<ScrollView>;
}) {
  const commentCacheList = useCacheData(CommentCacheList, postID);
  const {items: comments} = useCacheListData(commentCacheList);
  return (
    <View style={styles.container}>
      {comments.map((comment, i) => (
        <Comment
          key={comment.id}
          commentID={comment.id}
          lastCommentID={i > 0 ? comments[i - 1].id : null}
          realtime={comment.realtime}
          scrollViewRef={scrollViewRef}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Space.space3,
  },
});
