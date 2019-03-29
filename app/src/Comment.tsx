import {CommentCache} from "./cache/CommentCache";
import {CommentID} from "@connect/api-client";
import React from "react";
import {Text} from "react-native";
import {useCacheData} from "./cache/framework/Cache";

export function Comment({commentID}: {commentID: CommentID}) {
  const comment = useCacheData(CommentCache, commentID);

  return <Text>{comment.content}</Text>;
}
