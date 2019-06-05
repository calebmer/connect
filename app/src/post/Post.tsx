import {Color, Shadow, Space} from "../atoms";
import {GroupSlugCache, useGroupWithSlug} from "../group/GroupCache";
import {
  PostCommentsCache,
  PostCommentsCacheEntry,
  commentCountMore,
  watchPostComments,
} from "../comment/CommentCache";
import React, {useCallback, useEffect, useMemo, useRef, useState} from "react";
import {ScrollEvent, ScrollView, StyleSheet, View} from "react-native";
import {useCache, useCacheWithPrev} from "../cache/Cache";
import {AppError} from "../api/AppError";
import {CommentNewToolbar} from "../comment/CommentNewToolbar";
import {ErrorBoundary} from "../frame/ErrorBoundary";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {PostCache} from "./PostCache";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {PostMeasurements} from "./PostMeasurements";
import {PostShimmer} from "./PostShimmer";
import {PostVirtualizedComments} from "./PostVirtualizedComments";
import {Route} from "../router/Route";
import {Skimmer} from "../cache/Skimmer";
import {Trough} from "../molecules/Trough";
import {useGroupHomeLayout} from "../group/useGroupHomeLayout";

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
  GroupSlugCache.preload(groupSlug);
  PostCache.preload(postID);
  PostCommentsCache.preload(postID);

  // Load the data we will need for this component.
  const post = useCache(PostCache, postID);
  const group = useGroupWithSlug(groupSlug);

  // If the post exists but in a different group then throw an error saying we
  // can’t find the post.
  if (post.groupID !== group.id) {
    throw new AppError("Can not find this post.");
  }

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

  // State variables which determine if the jump button should be shown or not.
  // We show the button if the user hasn’t scrolled a view which is scrollable.
  //
  // The first state variable answers the question “is the scroll view
  // scrollable?” The second state variable answers the question “has the
  // user scrolled?”
  const jumpButtonAvailable = post.commentCount > commentCountMore;
  const [showJumpButton, setShowJumpButton] = useState(true);

  // Where should the scroll view be pinned to? Should we pin the scroll view
  // to the top of the screen or the bottom of the screen?
  const [pinTo, setPinTo] = useState<"top" | "bottom">("top");

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

    const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;

    // Measure the offset of the scrolled content from the top of the
    // scrollable container.
    const offset = contentOffset.y;

    // Only show the jump button if our scroll offset is below the jump
    // button threshold.
    const showJumpButtonThreshold = Space.space6;
    setShowJumpButton(offset <= showJumpButtonThreshold);

    if (
      // Will be zero before the layout is measured. Ignore those
      // unmeasured scroll events.
      layoutMeasurement.height !== 0 &&
      // Pin our scroll view to the bottom if we’ve scrolled near the bottom of
      // the content.
      offset + layoutMeasurement.height + Space.space6 >= contentSize.height
    ) {
      setPinTo("bottom");
    }
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

  // The comment count is either the number of comments declared on the post or
  // the number of comments our list has capacity for.
  const commentCount = Math.max(post.commentCount, comments.length);

  useEffect(() => {
    // Help the linter know we depend on `commentCount`.
    ((_commentCount: number) => {})(commentCount);

    // Whenever the comment count changes try to load more comments. This will
    // be a noop if all the comments in the visible range are loaded.
    if (visibleRange.current !== null) {
      handleVisibleRangeChange(visibleRange.current);
    }
  }, [commentCount, handleVisibleRangeChange]);

  return (
    <>
      <NavbarScrollView
        ref={scrollViewRef}
        route={route}
        title={group.name}
        hideNavbar={hideNavbar}
        keyboardDismissMode="interactive"
        scrollEventThrottle={PostVirtualizedComments.scrollEventThrottle}
        pinWindowTo={pinTo}
        onScroll={handleScroll}
      >
        <PostContent postID={post.id} />
        <Trough title="Comments" />
        <PostVirtualizedComments
          commentCount={commentCount}
          comments={comments}
          scrollViewRef={scrollViewRef}
          handleScroll={virtualizeScroll}
          onVisibleRangeChange={handleVisibleRangeChange}
        />
      </NavbarScrollView>
      <CommentNewToolbar
        postID={postID}
        showJumpButton={showJumpButton && jumpButtonAvailable}
        onJumpToEnd={useCallback(() => {
          if (scrollViewRef.current) {
            setPinTo("bottom");
            scrollViewRef.current.scrollToEnd({animated: false});
          }
        }, [])}
      />
    </>
  );
}

type RenderRange = {first: number; last: number};

type MaybePromise<T> = T | Promise<T>;

function PostContainer({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID | null;
}) {
  function handleRetry() {
    // Force ourselves to reload the post and comments before we retry.
    if (postID !== null) {
      PostCache.forceReload(postID);
      PostCommentsCache.forceReload(postID);
    }
  }

  return (
    <View style={styles.container}>
      <ErrorBoundary route={route} onRetry={handleRetry}>
        {postID != null ? (
          <React.Suspense fallback={<PostShimmer route={route} />}>
            <Post route={route} groupSlug={groupSlug} postID={postID} />
          </React.Suspense>
        ) : (
          <PostShimmer route={route} />
        )}
      </ErrorBoundary>
    </View>
  );
}

const PostContainerMemo = React.memo(PostContainer);
export {PostContainerMemo as Post};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: "hidden",
    maxWidth: PostMeasurements.maxWidth,
    backgroundColor: Color.white,
    ...Shadow.elevation3,
  },
});
