import {GroupCache} from "./cache/GroupCache";
import {GroupInboxLayout} from "./GroupInboxLayout";
import React from "react";

export function Group({slug}: {slug: string}) {
  // NOTE: We can’t suspend in `<GroupBanner>` which is a sibling of our
  // `<ScrollView>` since it causes weirdness with the scroll position.
  const group = GroupCache.useData(slug);

  return <GroupInboxLayout group={group} />;
}
