import {GroupCache} from "./cache/GroupCache";
import {GroupInbox} from "./GroupInbox";
import React from "react";
import {useCacheData} from "./cache/useCacheData";
import {useCacheListData} from "./cache/useCacheListData";

export function Group({slug}: {slug: string}) {
  const {group, postCacheList} = useCacheData(GroupCache, slug);
  const {items: posts} = useCacheListData(postCacheList);

  console.log(posts);

  return <GroupInbox group={group} />;
}
