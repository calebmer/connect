import {BodyText, Font} from "./atoms";
import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import React, {useContext} from "react";
import {AccountByline} from "./AccountByline";
import {AccountCache} from "./cache/AccountCache";
import {GroupItem} from "./GroupItem";
import {PostCache} from "./cache/PostCache";
import {PostID} from "@connect/api-client";
import {PostRoute} from "./router/AllRoutes";
import {Route} from "./router/Route";
import {useCacheData} from "./cache/framework/Cache";

function GroupItemFeed({
  route,
  groupSlug,
  postID,
  selected,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID;
  selected?: boolean;
}) {
  // TODO: Suspense handler for _just_ this component.
  const post = useCacheData(PostCache, postID);
  const account = useCacheData(AccountCache, post.authorID);

  // On a laptop, you can open a post without leaving the feed. So favor shorter
  // post previews and more posts on screen.
  const numberOfLines =
    useContext(GroupHomeLayoutContext) === GroupHomeLayout.Laptop ? 2 : 4;

  return (
    <GroupItem
      account={account}
      selected={selected}
      onPress={() => route.push(PostRoute, {groupSlug, postID: String(postID)})}
    >
      <AccountByline account={account} time={post.publishedAt} />
      <BodyText
        style={{maxHeight: Font.size2.lineHeight * numberOfLines}}
        numberOfLines={numberOfLines}
      >
        {post.content}
      </BodyText>
    </GroupItem>
  );
}

const GroupItemFeedMemo = React.memo(GroupItemFeed);
export {GroupItemFeedMemo as GroupItemFeed};
