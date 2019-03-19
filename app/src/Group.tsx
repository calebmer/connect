import {GroupCache} from "./cache/GroupCache";
import {GroupInbox} from "./GroupInbox";
import React from "react";
import {useCacheData} from "./cache/useCacheData";

export function Group({slug}: {slug: string}) {
  const {group} = useCacheData(GroupCache, slug);

  return <GroupInbox group={group} />;
}
