import {GroupCache} from "./cache/entities/GroupCache";
import {GroupInbox} from "./GroupInbox";
import React from "react";
import {useCacheData} from "./cache/Cache";

export function Group({slug}: {slug: string}) {
  console.log("render <Group>");

  const {group, postCacheList} = useCacheData(GroupCache, slug);

  console.log(group);

  // // TODO: Preloading!
  // const {items: posts} = useCacheListData(postCacheList);

  // console.log(posts);

  return <GroupInbox group={group} />;
}
