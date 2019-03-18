import {GroupCache} from "./cache/GroupCache";
import {GroupInbox} from "./GroupInbox";
import React from "react";

const postCountInitial = 10;
const postCountMore = 5;

export function Group({slug}: {slug: string}) {
  const group = GroupCache.useData(slug);

  return <GroupInbox group={group} />;
}
