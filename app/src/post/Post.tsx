import {Color, Font, Shadow, Space} from "../atoms";
import {
  PostCommentsCache,
  PostCommentsCacheEntry,
  commentCountMore,
  watchPostComments,
} from "../comment/CommentCache";
import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {ScrollEvent, ScrollView, StyleSheet, View} from "react-native";
import {useCache, useCacheWithPrev} from "../cache/Cache";
import {Comment} from "../comment/Comment";
import {CommentNewToolbar} from "../comment/CommentNewToolbar";
import {GroupCache} from "../group/GroupCache";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {PostCache} from "./PostCache";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {PostVirtualizedComments} from "./PostVirtualizedComments";
import {Route} from "../router/Route";
import {Skimmer} from "../cache/Skimmer";
import {Trough} from "../molecules/Trough";

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
  const hideNavbar =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  // HACK: A ref for an `onScroll` event handler that is set by our child
  // `<PostVirtualizedComments>` component. In this way that component passes
  // an event handler “up”.
  const virtualizeScroll = useRef<null | ((event: ScrollEvent) => void)>(null);

  // The current visible range of comments in our virtualized comment list.
  const visibleRange = useRef<RenderRange | null>(null);

  /**
   * Handles a scroll event on our navbar scroll view. Will both update the
   * virtualized list visible items and will load more items if applicable.
   */
  const handleScroll = useMemo(() => {
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

    // Used to calculate the velocity at which we will cancel loading more
    // comments. Velocity is calculated by “dy / dt” where dy is the difference
    // in position and dt is the difference in time. So in our case,
    // 400px / 200ms = 2px/ms. This means if we scroll faster than 2px per 1ms
    // we will consider the scroll to be “fast” and won’t load any comments.
    const differencePosition = 400;
    const differenceTime = 200;

    // The pending load which might be cancelled if we detect a fast scroll.
    let pendingLoad: {timeoutID: number; offset: number} | null = null;

    return (event: ScrollEvent) => {
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

      // If we do not have a pending load then schedule one...
      if (pendingLoad === null) {
        // If our timeout runs then update our comment cache and load
        // more comments.
        const timeoutID = setTimeout(() => {
          pendingLoad = null;
          PostCommentsCache.updateWhenReady(postID, loadMoreComments);
        }, differenceTime);

        pendingLoad = {timeoutID, offset};
      } else {
        // If we traveled too many pixels than cancel our load to fetch
        // more comments.
        if (Math.abs(offset - pendingLoad.offset) > differencePosition) {
          clearTimeout(pendingLoad.timeoutID);
          pendingLoad = null;
        }
      }
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
    <View style={styles.background}>
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
          onVisibleRangeChange={useCallback((range: RenderRange) => {
            visibleRange.current = range;
          }, [])}
        />
      </NavbarScrollView>
      <CommentNewToolbar
        postID={postID}
        showJumpButton={showJumpButton && jumpButtonAvailable}
        scrollViewRef={scrollViewRef}
      />
    </View>
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};

type RenderRange = {first: number; last: number};

type MaybePromise<T> = T | Promise<T>;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    overflow: "hidden",
    backgroundColor: Color.white,
    ...Shadow.elevation3,

    // The maximum width is designed to give a comment `Font.maxWidth` which
    // means the post text will end up being a bit wider.
    maxWidth: Comment.paddingLeft + Font.maxWidth + Comment.paddingRight,
  },
});
