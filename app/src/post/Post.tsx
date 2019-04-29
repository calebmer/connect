import {CacheList, useCacheListWithoutSuspense} from "../cache/CacheList";
import {Color, Font, Shadow, Space} from "../atoms";
import {CommentCacheList, CommentCacheListEntry} from "../comment/CommentCache";
import {Dimensions, ScrollView, StyleSheet, View} from "react-native";
import React, {useContext, useRef} from "react";
import {useCache, useCacheWithoutSuspense} from "../cache/Cache";
import {Comment} from "../comment/Comment";
import {CommentNewToolbar} from "../comment/CommentNewToolbar";
import {GroupCache} from "../group/GroupCache";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {Loading} from "../molecules/Loading";
import {NavbarFlatList} from "../frame/NavbarFlatList";
import {PostCache} from "./PostCache";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {Route} from "../router/Route";
import {Trough} from "../molecules/Trough";

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

  // Hide the navbar when we are using the laptop layout.
  const hideNavbar =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  // Preload all our post data so that they load in the background while we
  // render our component.
  GroupCache.preload(groupSlug);
  PostCache.preload(postID);
  CommentCacheList.preload(postID);

  // Load our group data for our title.
  const group = useCache(GroupCache, groupSlug);

  // Load the comments data for our flat list. We don’t want to suspend since
  // often when we enter a post we will have the post content which we want to
  // display immediately but not the comments. We want the comments to
  // asynchronously load in over time.
  const commentsCache = useCacheWithoutSuspense(CommentCacheList, postID);
  const {loading, items: comments} = useCacheListWithoutSuspense(
    commentsCache || CacheList.never(),
  );

  return (
    <View style={styles.background}>
      <NavbarFlatList<CommentCacheListEntry>
        ref={scrollViewRef}
        contentContainerStyle={styles.container}
        // `Navbar`
        route={route}
        title={group.name}
        hideNavbar={hideNavbar}
        // `ScrollView`
        keyboardDismissMode="interactive"
        // `FlatList` decoration
        ListHeaderComponent={
          <>
            <PostContent postID={postID} />
            <Trough title="Comments" />
          </>
        }
        ListFooterComponent={
          loading ? (
            <View style={styles.loading}>
              <Loading />
            </View>
          ) : null
        }
        // `FlatList` data
        data={comments}
        keyExtractor={comment => comment.id}
        renderItem={({item: comment, index}) => (
          <Comment
            key={comment.id}
            commentID={comment.id}
            lastCommentID={index > 0 ? comments[index - 1].id : null}
            realtime={comment.realtime}
            scrollViewRef={scrollViewRef}
          />
        )}
        initialNumToRender={Math.ceil(
          // Estimate the maximum number of comments that can fit on screen at
          // a time.
          (Dimensions.get("screen").height * 0.75) /
            (Font.size2.lineHeight * 2),
        )}
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
  loading: {
    paddingTop: Space.space3,
  },
});
