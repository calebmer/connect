import {Color, Font, Shadow} from "../atoms";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import {
  PostCommentsCache,
  PostCommentsCacheEntry,
  commentCountMore,
} from "../comment/CommentCache";
import React, {useContext, useMemo, useRef} from "react";
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
import {debounce} from "../utils/debounce";

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
    {items: ReadonlyArray<PostCommentsCacheEntry | typeof Skimmer.empty>}
  >(PostCommentsCache, postID, {items: []});

  // Hide the navbar when we are using the laptop layout.
  const hideNavbar =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  const onScroll = useRef<
    null | ((event: NativeSyntheticEvent<NativeScrollEvent>) => void)
  >(null);

  return (
    <View style={styles.background}>
      <NavbarScrollView
        ref={scrollViewRef}
        // ## Navbar
        route={route}
        title={group.name}
        hideNavbar={hideNavbar}
        // ## Scroll View
        keyboardDismissMode="interactive"
        // ## Scroll Events
        scrollEventThrottle={PostVirtualizedComments.scrollEventThrottle}
        onScroll={event => {
          if (onScroll.current !== null) {
            onScroll.current(event);
          }
        }}
      >
        <PostContent postID={post.id} />
        <Trough title="Comments" />
        <PostVirtualizedComments
          post={post}
          comments={comments}
          onScroll={onScroll}
          onVisibleRangeChange={useVisibleRangeChange(postID)}
        />
      </NavbarScrollView>
      <CommentNewToolbar postID={postID} scrollViewRef={scrollViewRef} />
    </View>
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};

type RenderRange = {first: number; last: number};

type MaybePromise<T> = T | Promise<T>;

/**
 * Creates an event handler for `onVisibleRangeChange` which will load comments
 * in that range that have not been loaded yet. Will keep making network
 * requests until the entire range has been loaded.
 */
function useVisibleRangeChange(postID: PostID) {
  const visibleRange = useRef<RenderRange>({first: 0, last: 0});

  return useMemo(() => {
    /**
     * We only want to call `loadMoreComments` once after the user finishes
     * scrolling. We use debouncing to accomplish that effect.
     */
    const loadMoreCommentsDebounced = debounce(200, () => {
      // Schedule a load for our new comments. We don’t want to schedule a
      // load for some items while the user is scrolling. When they finish
      // scrolling we want to load based on the items that are
      // currently visible.
      PostCommentsCache.updateWhenReady(postID, loadMoreComments);
    });

    /**
     * Load more comments based on the items in view when our current comment
     * list has finished loading.
     */
    function loadMoreComments(
      comments: Skimmer<PostCommentsCacheEntry>,
    ): MaybePromise<Skimmer<PostCommentsCacheEntry>> {
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
      // Update the current visible range items...
      visibleRange.current = range;

      // Schedule a load for our new comments. We don’t want to schedule a
      // load for some items while the user is scrolling. When they finish
      // scrolling we want to load based on the items that are
      // currently visible.
      loadMoreCommentsDebounced();
    };
  }, [postID]);
}

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
