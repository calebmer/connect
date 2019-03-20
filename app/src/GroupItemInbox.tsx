import React from "react";

function GroupItemInbox() {
  if (Math.random() > 0) {
    throw new Error("TODO");
  } else {
    return null;
  }
  // return (
  //   <GroupItem account={item.author}>

  //   </GroupItem>
  // );
}

const _GroupItemInbox = React.memo(GroupItemInbox);
export {_GroupItemInbox as GroupItemInbox};
