import React, {useContext} from "react";
import {PostContent} from "./PostContent";
import {Trough} from "../molecules/Trough";
import {PostID} from "@connect/api-client";
import {NavbarScrollView} from "../frame/NavbarScrollView";
import {GroupHomeLayout} from "../group/GroupHomeLayout";
import {Route} from "../router/Route";
import {GroupCache} from "../group/GroupCache";
import {PostCache} from "./PostCache";
import {PostCommentsCache} from "../comment/CommentCache";
import {useCache} from "../cache/Cache";
import {CommentShimmer} from "../comment/CommentShimmer";
import {Dimensions, FlatList, StyleSheet} from "react-native";
import {NavbarFlatList} from "../frame/NavbarFlatList";
import {NavbarVirtualizedList} from "../frame/NavbarVirtualizedList";
import {Font, Space} from "../atoms";

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

  // Hide the navbar when we are using the laptop layout.
  const hideNavbar =
    useContext(GroupHomeLayout.Context) === GroupHomeLayout.Laptop;

  return (
    <NavbarVirtualizedList<number>
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
      getItem={(_data, index) => index}
      keyExtractor={(index: number) => String(index)}
      initialNumToRender={Math.ceil(
        // Estimate the maximum number of comments that can fit on screen at
        // a time.
        (Dimensions.get("screen").height * 0.75) / (Font.size2.lineHeight * 2),
      )}
      renderItem={({index}) => <CommentShimmer index={index} />}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingBottom: Space.space3,
  },
});
