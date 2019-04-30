import {Dimensions, StyleSheet} from "react-native";
import {Font, Space} from "../atoms";
import {
  PostCommentsCache,
  PostCommentsCacheEntry,
} from "../comment/CommentCache";
import React, {useContext} from "react";
import {useCache, useCacheWithPrev} from "../cache/Cache";
import {Comment} from "../comment/Comment";
import {CommentShimmer} from "../comment/CommentShimmer";
import {GroupCache} from "../group/GroupCache";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {NavbarVirtualizedList} from "../frame/NavbarVirtualizedList";
import {PostCache} from "./PostCache";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {Route} from "../router/Route";
import {Trough} from "../molecules/Trough";

export function Post2({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID;
}) {
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
    <NavbarVirtualizedList<number | PostCommentsCacheEntry>
      // ## Styles
      contentContainerStyle={styles.container}
      // ## Navbar
      route={route}
      title={group.name}
      hideNavbar={hideNavbar}
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
      getItem={(_data, index) => comments[index] || index}
      keyExtractor={item => (typeof item === "number" ? String(item) : item.id)}
      initialNumToRender={Math.ceil(
        // Estimate the maximum number of comments that can fit on screen at
        // a time.
        (Dimensions.get("screen").height * 0.75) / (Font.size2.lineHeight * 2),
      )}
      renderItem={({item: comment, index}) =>
        typeof comment === "number" ? (
          <CommentShimmer index={comment} />
        ) : (
          <Comment
            commentID={comment.id}
            lastCommentID={index > 0 ? comments[index - 1].id : null}
            realtime={comment.realtime}
          />
        )
      }
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Space.space3,
  },
});
