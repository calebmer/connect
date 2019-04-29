import {BodyText, Font} from "../atoms";
import React, {useContext, useState} from "react";
import {ReadonlyMutable, useMutableSelect} from "../cache/Mutable";
import {AccountByline} from "../account/AccountByline";
import {AccountCache} from "../account/AccountCache";
import {GroupHomeLayout} from "./GroupHomeLayout";
import {GroupItem} from "./GroupItem";
import {PostCache} from "../post/PostCache";
import {PostCommentsCache} from "../comment/CommentCache";
import {PostID} from "@connect/api-client";
import {PostRoute} from "../router/AllRoutes";
import {Route} from "../router/Route";
import {stall} from "../utils/stall";
import {useCache} from "../cache/Cache";

function GroupItemFeed({
  route,
  groupSlug,
  postID,
  selectedPostID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID;
  selectedPostID: ReadonlyMutable<PostID | undefined>;
}) {
  // TODO: Suspense handler for _just_ this component.
  const {post} = useCache(PostCache, postID);
  const account = useCache(AccountCache, post.authorID);

  // Is this post selected? We will only re-render if the value of
  // `selected` changes.
  const selected = useMutableSelect(
    selectedPostID,
    selectedPostID => selectedPostID === postID,
  );

  // Are we in the process of selecting this group item?
  const [selecting, setSelecting] = useState(false);

  function handleSelect() {
    // While we wait for stuff to load, set selecting to true to give the
    // user immediate visual feedback. We have an effect which will set
    // this back to false once we’ve selected the component.
    setSelecting(true);

    // Wait for comments to load before pushing the new route...
    //
    // We assume that this will eventually change `selectedPostID`.
    stall(PostCommentsCache.load(postID), () => {
      route.push(PostRoute, {groupSlug, postID: String(postID)});

      // NOTE: It is important that this runs after `route.push()`! Since
      // `route.push()` will synchronously re-render and select this item.
      setSelecting(false);
    });
  }

  // On a laptop, you can open a post without leaving the feed. So favor shorter
  // post previews and more posts on screen.
  const numberOfLines =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop ? 2 : 4;

  return (
    <GroupItem
      account={account}
      active={selecting}
      selected={selected}
      onSelect={handleSelect}
    >
      <AccountByline account={account} publishedAt={post.publishedAt} />
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
