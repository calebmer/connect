import {GroupItem} from "./GroupItem";
import {Post} from "./MockData";
import React from "react";

export function GroupItemFeed({post}: {post: Post}) {
  return <GroupItem account={post.author}>{null}</GroupItem>;
}
