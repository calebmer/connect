import {GroupCache} from "./cache/entities/GroupCache";
import {GroupInbox} from "./GroupInbox";
import React from "react";
import {useCacheData} from "./cache/Cache";
import {useCacheListData} from "./cache/useCacheListData";

export function Group({slug}: {slug: string}) {
  const {group, postCacheList} = useCacheData(GroupCache, slug);
  // TODO: Preloading!
  const {items: posts} = useCacheListData(postCacheList);

  console.log(posts);

  return <GroupInbox group={group} />;
}
