import {Color, Font, Shadow} from "../atoms";
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  StyleSheet,
  View,
  ViewToken,
  ViewabilityConfigCallbackPair,
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
        />
      </NavbarScrollView>
      {/* <NavbarVirtualizedList<PostCommentsCacheEntry | typeof empty>
        ref={scrollViewRef}
        // ## Styles
        contentContainerStyle={styles.container}
        // ## Navbar
        route={route}
        title={group.name}
        hideNavbar={hideNavbar}
        // ## Scroll View
        keyboardDismissMode="interactive"
        // ## Post Content
        ListHeaderComponent={<PostContent postID={postID} />}
        // ## Post Comments
        data={true}
        getItemCount={() => Math.max(comments.length, post.commentCount)}
        getItem={(_data, index) => comments[index] || empty}
        keyExtractor={(comment, index) =>
          comment === empty ? String(index) : comment.id
        }
        initialNumToRender={Math.ceil(
          // Estimate the maximum number of comments that can fit on screen at
          // a time.
          (Dimensions.get("screen").height * 0.75) /
            (Font.size2.lineHeight * 2),
        )}
        renderItem={({item: comment, index}) => {
          // If we have no comment then render a shimmer which represents a
          // loading state...
          if (comment === empty) {
            return <CommentShimmer index={index} />;
          } else {
            // If we do have a comment then render it. Also if we have a comment
            // above this one then let’s get its ID...
            const lastComment = index > 0 ? comments[index - 1] : null;
            const lastCommentID =
              lastComment && lastComment !== empty ? lastComment.id : null;
            return (
              <Comment commentID={comment.id} lastCommentID={lastCommentID} />
            );
          }
        }}
        // ## Viewability
        viewabilityConfigCallbackPairs={[useLoadMoreViewabilityConfig(postID)]}
      /> */}
      <CommentNewToolbar postID={postID} scrollViewRef={scrollViewRef} />
    </View>
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};

/**
 * Creates a viewability config which will watch item viewability and load more
 * items if one comes into view which hasn’t been loaded yet.
 */
function useLoadMoreViewabilityConfig(
  postID: PostID,
): ViewabilityConfigCallbackPair {
  // The currently viewable items.
  const viewableItems = useRef<ReadonlyArray<ViewToken>>([]);

  return useMemo(() => {
    /**
     * We only want to call `loadMoreComments` once after the user finishes
     * scrolling. We use debouncing to accomplish that effect.
     */
    const loadMoreCommentsDebounced = debounce(200, loadMoreComments);

    /**
     * Load more comments based on the items in view when our current comment
     * list has finished loading.
     */
    function loadMoreComments() {
      // Schedule a load for our new comments. We don’t want to schedule a
      // load for some items while the user is scrolling. When they finish
      // scrolling we want to load based on the items that are
      // currently visible.
      PostCommentsCache.updateWhenReady(postID, comments => {
        // If there are no viewable items then don’t bother...
        if (viewableItems.current.length < 1) return comments;
        const firstViewableItem = viewableItems.current[0];

        // NOTE: According to the types, a viewable item might not have
        // an index. I (Caleb) don’t know when that will happen, so just
        // ignore that case for now.
        if (firstViewableItem.index === null) return comments;

        // We want to make our network trips worth it. Always select
        // enough comments to justify a request instead of selecting the
        // one or two currently in view.
        const limit = Math.max(viewableItems.current.length, commentCountMore);

        // If we are fetching more comments than we can fit on screen,
        // then center the new selection.
        const offset = Math.max(
          0,
          firstViewableItem.index -
            Math.floor((limit - viewableItems.current.length) / 2),
        );

        // Go ahead and load our new comments!
        return comments.load({limit, offset});
      });
    }

    const viewabilityConfig: ViewabilityConfigCallbackPair = {
      viewabilityConfig: {
        // We want to load items with even a single viewable pixel.
        itemVisiblePercentThreshold: 0,
      },

      // When the user starts to finish scrolling, let’s schedule a load for
      // some new comments!
      onViewableItemsChanged: info => {
        // Update the current viewable items...
        viewableItems.current = info.viewableItems;

        // Schedule a load for our new comments. We don’t want to schedule a
        // load for some items while the user is scrolling. When they finish
        // scrolling we want to load based on the items that are
        // currently visible.
        loadMoreCommentsDebounced();
      },
    };

    return viewabilityConfig;
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
