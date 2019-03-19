import {GroupCache} from "./cache/entities/GroupCache";
import {GroupInbox} from "./GroupInbox";
import React from "react";
import {useCacheData} from "./cache/Cache";
import {useCacheListData} from "./cache/CacheList";

export function Group({slug}: {slug: string}) {
  const {group, postCacheList} = useCacheData(GroupCache, slug);
  const posts = useCacheListData(postCacheList);

  return <GroupInbox group={group} />;
}
