import {
  PostCommentsCache,
  PostCommentsCacheEntry,
  commentCountMore,
  watchPostComments,
} from "../comment/CommentCache";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ScrollEvent, ScrollView} from "react-native";
import {useCache, useCacheWithPrev} from "../cache/Cache";
import {CommentNewToolbar} from "../comment/CommentNewToolbar";
import {GroupCache} from "../group/GroupCache";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {PostCache} from "./PostCache";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {PostVirtualizedComments} from "./PostVirtualizedComments";
import {Route} from "../router/Route";
import {Skimmer} from "../cache/Skimmer";
import {Space} from "../atoms";
import {Trough} from "../molecules/Trough";
import {useGroupHomeLayout} from "../group/useGroupHomeLayout";

// The threshold at which we will show the jump button. When the threshold is
// passed we will hide the jump button.
const showJumpButtonThreshold = Space.space6;

function Post({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID;
}) {
  const scrollViewRef = useRef<ScrollView>(null);

  // Preload all our post data so that they load in the background while we
  // render our component.
  GroupCache.preload(groupSlug);
  PostCache.preload(postID);
  PostCommentsCache.preload(postID);

  // Load the data we will need for this component.
  const {post} = useCache(PostCache, postID);
  const group = useCache(GroupCache, groupSlug);

  // Load the comments from our post comments cache. Never suspend, though. We
  // want the post content to be visible while we load comments.
  const {
    data: {items: comments},
  } = useCacheWithPrev<
    PostID,
    {items: ReadonlyArray<PostCommentsCacheEntry | undefined>}
  >(PostCommentsCache, postID, {items: []});

  // Keep track of all the realtime comments which were published after we
  // mounted this component.
  useEffect(() => {
    const subscription = watchPostComments(postID);
    return () => subscription.unsubscribe();
  }, [postID]);

  // Hide the navbar when we are using the laptop layout.
  const hideNavbar = useGroupHomeLayout();

  // HACK: A ref for an `onScroll` event handler that is set by our child
  // `<PostVirtualizedComments>` component. In this way that component passes
  // an event handler “up”.
  const virtualizeScroll = useRef<null | ((event: ScrollEvent) => void)>(null);

  /**
   * Handles a scroll event on our navbar scroll view. Will both update the
   * virtualized list visible items and will load more items if applicable.
   */
  const handleScroll = useCallback((event: ScrollEvent) => {
    // Call the virtualized scroll event. This will update which comments are
    // visible in our virtualized list.
    if (virtualizeScroll.current !== null) {
      virtualizeScroll.current(event);
    }

    // Measure the offset of the scrolled content from the top of the
    // scrollable container.
    const offset = event.nativeEvent.contentOffset.y;

    // Only show the jump button if our scroll offset is below the jump
    // button threshold.
    setShowJumpButton(offset <= showJumpButtonThreshold);
  }, []);

  // The current visible range of comments in our virtualized comment list.
  const visibleRange = useRef<RenderRange | null>(null);

  /**
   * When the range of visible items changes we try to load the items in the
   * visible range if they are not already loaded.
   */
  const handleVisibleRangeChange = useMemo(() => {
    /**
     * Load more comments based on the items in view when our current comment
     * list has finished loading.
     */
    function loadMoreComments(
      comments: Skimmer<PostCommentsCacheEntry>,
    ): MaybePromise<Skimmer<PostCommentsCacheEntry>> {
      if (visibleRange.current === null) return comments;

      // The number of items in the visible range.
      const visibleRangeLength =
        visibleRange.current.last - visibleRange.current.first;

      // We want to make our network trips worth it. Always select
      // enough comments to justify a request instead of selecting the
      // one or two currently in view.
      const limit = Math.max(visibleRangeLength, commentCountMore);

      // If we are fetching more comments than we can fit on screen,
      // then center the new selection.
      const offset = Math.max(
        0,
        visibleRange.current.first -
          Math.floor((limit - visibleRangeLength) / 2),
      );

      // Go ahead and load our new comments!
      const newComments = comments.load({limit, offset});

      // If we ended up loading some comments from our API then try loading some
      // more. We keep trying to load more until we’ve loaded all the comments
      // in this visible range.
      if (newComments instanceof Promise) {
        return newComments.then(loadMoreComments);
      } else {
        return newComments;
      }
    }

    return (range: RenderRange) => {
      visibleRange.current = range;
      PostCommentsCache.updateWhenReady(postID, loadMoreComments);
    };
  }, [postID]);

  // State variables which determine if the jump button should be shown or not.
  // We show the button if the user hasn’t scrolled a view which is scrollable.
  //
  // The first state variable answers the question “is the scroll view
  // scrollable?” The second state variable answers the question “has the
  // user scrolled?”
  const jumpButtonAvailable = post.commentCount > commentCountMore;
  const [showJumpButton, setShowJumpButton] = useState(true);

  return (
    <>
      <NavbarScrollView
        ref={scrollViewRef}
        route={route}
        title={group.name}
        hideNavbar={hideNavbar}
        keyboardDismissMode="interactive"
        scrollEventThrottle={PostVirtualizedComments.scrollEventThrottle}
        onScroll={handleScroll}
      >
        <PostContent postID={post.id} />
        <Trough title="Comments" />
        <PostVirtualizedComments
          commentCount={Math.max(post.commentCount, comments.length)}
          comments={comments}
          scrollViewRef={scrollViewRef}
          handleScroll={virtualizeScroll}
          onVisibleRangeChange={handleVisibleRangeChange}
        />
      </NavbarScrollView>
      <CommentNewToolbar
        postID={postID}
        showJumpButton={showJumpButton && jumpButtonAvailable}
        scrollViewRef={scrollViewRef}
      />
    </>
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};

type RenderRange = {first: number; last: number};

type MaybePromise<T> = T | Promise<T>;
