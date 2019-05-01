import {Color, Font, Shadow, Space} from "../atoms";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  View,
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
import {CommentShimmer} from "../comment/CommentShimmer";
import {GroupCache} from "../group/GroupCache";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {NavbarVirtualizedList} from "../frame/NavbarVirtualizedList";
import {PostCache} from "./PostCache";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {Route} from "../router/Route";
import {Trough} from "../molecules/Trough";
import {debounce} from "../utils/debounce";
import {empty} from "../cache/Skimmer";

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

  const {
    data: {items: comments},
  } = useCacheWithPrev<
    PostID,
    {items: ReadonlyArray<PostCommentsCacheEntry | typeof empty>}
  >(PostCommentsCache, postID, {items: []});

  // Hide the navbar when we are using the laptop layout.
  const hideNavbar =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  return (
    <View style={styles.background}>
      <NavbarVirtualizedList<PostCommentsCacheEntry | typeof empty>
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
        ListHeaderComponent={
          <>
            <PostContent postID={postID} />
            <Trough title="Comments" />
          </>
        }
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
              <Comment
                commentID={comment.id}
                lastCommentID={lastCommentID}
                realtime={comment.realtime}
              />
            );
          }
        }}
        // ## Viewability
        viewabilityConfigCallbackPairs={[
          useMemo(() => createLoadMoreViewabilityConfig(postID), [postID]),
        ]}
      />
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
function createLoadMoreViewabilityConfig(
  postID: PostID,
): ViewabilityConfigCallbackPair {
  const viewabilityConfig: ViewabilityConfigCallbackPair = {
    viewabilityConfig: {
      // We want to load items with even a single viewable pixel.
      itemVisiblePercentThreshold: 0,
    },

    // When the user starts to finish scrolling, let’s load some
    // new comments!
    onViewableItemsChanged: debounce(100, ({viewableItems}) => {
      if (viewableItems.length < 1) return;
      const firstViewableItem = viewableItems[0];

      // NOTE: According to the types, a viewable item might not have
      // an index. I (Caleb) don’t know when that will happen, so just
      // ignore that case for now.
      if (firstViewableItem.index === null) return;

      // We want to make our network trips worth it. Always select
      // enough comments to justify a request instead of selecting the
      // one or two currently in view.
      const limit = Math.max(viewableItems.length, commentCountMore);

      // If we are fetching more comments than we can fit on screen,
      // then center the new selection.
      const offset = Math.max(
        0,
        firstViewableItem.index -
          Math.floor((limit - viewableItems.length) / 2),
      );

      // Go ahead and load our new comments!
      PostCommentsCache.update(postID, comments => {
        return comments.load({limit, offset});
      });
    }),
  };

  return viewabilityConfig;
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
  container: {
    paddingBottom: Space.space3,
  },
});
