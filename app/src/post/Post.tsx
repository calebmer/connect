import {Color, Font, Shadow, Space} from "../atoms";
import {Dimensions, ScrollView, StyleSheet, View} from "react-native";
import {
  PostCommentsCache,
  PostCommentsCacheEntry,
} from "../comment/CommentCache";
import React, {useContext, useRef} from "react";
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
  } = useCacheWithPrev<PostID, {items: ReadonlyArray<PostCommentsCacheEntry>}>(
    PostCommentsCache,
    postID,
    {items: []},
  );

  // Hide the navbar when we are using the laptop layout.
  const hideNavbar =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  return (
    <View style={styles.background}>
      <NavbarVirtualizedList<{shimmer: true} | PostCommentsCacheEntry>
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
        getItemCount={() => post.commentCount}
        getItem={(_data, index) => comments[index] || {shimmer: true}}
        keyExtractor={(item, index) =>
          "shimmer" in item ? String(index) : item.id
        }
        initialNumToRender={Math.ceil(
          // Estimate the maximum number of comments that can fit on screen at
          // a time.
          (Dimensions.get("screen").height * 0.75) /
            (Font.size2.lineHeight * 2),
        )}
        renderItem={({item: comment, index}) =>
          "shimmer" in comment ? (
            <CommentShimmer index={index} />
          ) : (
            <Comment
              commentID={comment.id}
              lastCommentID={index > 0 ? comments[index - 1].id : null}
              realtime={comment.realtime}
            />
          )
        }
        // ## Viewability
        viewabilityConfigCallbackPairs={[
          // We use this viewability config to determine which comments we need
          // to load. We don’t use this viewability config for analytics.
          {
            viewabilityConfig: {
              // We want to load items with even a single viewable pixel.
              itemVisiblePercentThreshold: 0,
            },

            // When the user starts to finish scrolling, let’s load some
            // new comments!
            onViewableItemsChanged: debounce(100, ({viewableItems}) => {
              if (viewableItems.length > 0) {
                console.log(
                  viewableItems.length,
                  viewableItems[0].index,
                  viewableItems[viewableItems.length - 1].index,
                );
              }
            }),
          },
        ]}
      />
      <CommentNewToolbar postID={postID} scrollViewRef={scrollViewRef} />
    </View>
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};

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
