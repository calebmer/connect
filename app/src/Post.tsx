import React from "react";
import {Text} from "react-native";

export function Post({groupSlug, postID}: {groupSlug: string; postID: string}) {
  return <Text>{postID}</Text>;
}
