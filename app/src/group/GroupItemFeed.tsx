import {BodyText, Font} from "../atoms";
import React, {useEffect, useRef, useState} from "react";
import {ReadonlyMutable, useMutableSelect} from "../cache/Mutable";
import {useCache, useCacheWithLastKnownGood} from "../cache/Cache";
import {AccountByline} from "../account/AccountByline";
import {AccountCache} from "../account/AccountCache";
import {GroupItem} from "./GroupItem";
import {Platform} from "react-native";
import {PostCache} from "../post/PostCache";
import {PostCommentsCache} from "../comment/CommentCache";
import {PostID} from "@connect/api-client";
import {PostRoute} from "../router/AllRoutes";
import {Route} from "../router/Route";
import {stall} from "../utils/stall";
import {unstable_scheduleCallback} from "scheduler";
import {useGroupHomeLayout} from "./useGroupHomeLayout";

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
  // Keep track of whether our component is mounted or not.
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Load data from our cache!
  const {
    data: {post},
  } = useCacheWithLastKnownGood(PostCache, postID);
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

    // Wait for comments to load before pushing the new route. That will avoid
    // a loading spinner flash if the comments load from the network quickly.
    //
    // However, on native stalling on the comment load is noticeable since we
    // also have configured `react-native-navigation` to wait for the next
    // screen to finish rendering before we animate the screen in.
    if (Platform.OS === "web") {
      stall(PostCommentsCache.load(postID), actuallyHandleSelect);
    } else {
      actuallyHandleSelect();
    }
  }

  function actuallyHandleSelect() {
    route.push(PostRoute, {groupSlug, postID: String(postID)}).then(done, done);

    function done() {
      // Schedule a callback to unselect the item (which starts an animation).
      // This way we let the post finish rendering before starting the
      // animation. If we animated while the post was rendering then we’d
      // probably drop animation frames.
      unstable_scheduleCallback(() => {
        // NOTE: On mobile calling `route.push()` will immediately unmount the
        // component. React will warn us that we tried to update state after
        // unmounting so only update state if we are mounted.
        if (isMounted.current) {
          setSelecting(false);
        }
      });
    }
  }

  // On a laptop, you can open a post without leaving the feed. So favor shorter
  // post previews and more posts on screen.
  const numberOfLines = useGroupHomeLayout() ? 2 : 4;

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
