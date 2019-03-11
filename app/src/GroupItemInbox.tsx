import {GroupItem} from "./GroupItem";
import {InboxItem} from "./MockData";
import React from "react";

export function GroupItemInbox({item}: {item: InboxItem}) {
  return <GroupItem account={item.author}>{null}</GroupItem>;
}
