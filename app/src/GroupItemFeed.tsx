import {BodyText, Font} from "./atoms";
import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import {Mutable, useMutableSelect} from "./cache/framework/Mutable";
import React, {useContext, useEffect, useState} from "react";
import {AccountByline} from "./AccountByline";
import {AccountCache} from "./cache/AccountCache";
import {CommentCacheList} from "./cache/CommentCache";
import {GroupItem} from "./GroupItem";
import {PostCache} from "./cache/PostCache";
import {PostID} from "@connect/api-client";
import {PostRoute} from "./router/AllRoutes";
import {Route} from "./router/Route";
import {stall} from "./stall";
import {useCacheData} from "./cache/framework/Cache";

function GroupItemFeed({
  route,
  groupSlug,
  postID,
  selectedPostID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID;
  selectedPostID: Mutable<PostID | undefined>;
}) {
  // TODO: Suspense handler for _just_ this component.
  const post = useCacheData(PostCache, postID);
  const account = useCacheData(AccountCache, post.authorID);

  // Is this post selected? We will only re-render if the value of
  // `selected` changes.
  const selected = useMutableSelect(
    selectedPostID,
    selectedPostID => selectedPostID === postID,
  );

  // On a laptop, you can open a post without leaving the feed. So favor shorter
  // post previews and more posts on screen.
  const numberOfLines =
    useContext(GroupHomeLayoutContext) === GroupHomeLayout.Laptop ? 2 : 4;

  // Are we in the process of selecting this group item?
  const [selecting, setSelecting] = useState(false);

  // If we selected the component then we can set `selecting` back to false.
  useEffect(() => {
    if (selected && selecting) {
      setSelecting(false);
    }
  }, [selected, selecting]);

  return (
    <GroupItem
      account={account}
      active={selecting}
      selected={selected}
      onSelect={() => {
        // While we wait for stuff to load, set selecting to true to give the
        // user immediate visual feedback. We have an effect which will set
        // this back to false once we’ve selected the component.
        setSelecting(true);

        // Wait for comments to load before pushing the new route...
        stall(CommentCacheList.load(postID), () => {
          route.push(PostRoute, {groupSlug, postID: String(postID)});
        });
      }}
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
