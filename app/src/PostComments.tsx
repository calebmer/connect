import {Comment} from "./Comment";
import {CommentCacheList} from "./cache/CommentCache";
import {PostID} from "@connect/api-client";
import React from "react";
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
    <>
      {comments.map(comment => (
        <Comment key={comment.id} commentID={comment.id} />
      ))}
    </>
  );
}
