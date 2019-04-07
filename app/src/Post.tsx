import {Color, Space} from "./atoms";
import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import {Platform, ScrollView, StyleSheet, View} from "react-native";
import React, {useContext, useState} from "react";
import {GroupCache} from "./cache/GroupCache";
import {NavbarNative} from "./NavbarNative";
import {PostComments} from "./PostComments";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {Route} from "./router/Route";
import {Trough} from "./Trough";
import {useCacheData} from "./cache/framework/Cache";

function Post({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID;
}) {
  const [hideNavbarBackground, setHideNavbarBackground] = useState(true);
  const isLaptop =
    useContext(GroupHomeLayoutContext) === GroupHomeLayout.Laptop;

  return (
    <>
      {Platform.OS !== "web" && (
        // NOTE: This will load data from the group cache. We won’t even render
        // the navbar on web so let’s avoid loading  that data if we aren’t on
        // the web platform.
        <PostNavbarNative
          route={route}
          groupSlug={groupSlug}
          hideBackground={hideNavbarBackground}
        />
      )}
      <ScrollView
        style={styles.background}
        contentContainerStyle={styles.container}
        scrollIndicatorInsets={scrollIndicatorInsets}
        scrollEventThrottle={16}
        onScroll={event => {
          if (Platform.OS !== "web") {
            setHideNavbarBackground(event.nativeEvent.contentOffset.y <= 0);
          }
        }}
      >
        <View style={[styles.section, isLaptop && styles.sectionExtraPadding]}>
          <PostContent postID={postID} />
        </View>
        <Trough title="Comments" />
        <View style={[styles.section, isLaptop && styles.sectionExtraPadding]}>
          <PostComments postID={postID} />
        </View>
      </ScrollView>
    </>
  );
}

function PostNavbarNative({
  route,
  groupSlug,
  hideBackground,
}: {
  route: Route;
  groupSlug: string;
  hideBackground?: boolean;
}) {
  const group = useCacheData(GroupCache, groupSlug);

  return (
    <NavbarNative
      title={group.name}
      leftIcon="arrow-left"
      onLeftIconPress={() => route.pop()}
      hideBackground={hideBackground}
    />
  );
}

// Don’t re-render `<Post>` unless the props change.
const PostMemo = React.memo(Post);
export {PostMemo as Post};

/**
 * Component we use for a post’s route. It takes `postID` as a string instead of
 * an integer. We convert it to a `PostID` in this component and pass
 * it to `<Post>`.
 */
export function PostRoute({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: string;
}) {
  return (
    <Post
      route={route}
      groupSlug={groupSlug}
      postID={parseInt(postID, 10) as PostID}
    />
  );
}

const scrollIndicatorInsets = {top: NavbarNative.height};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Color.white,
  },
  container: {
    paddingTop: NavbarNative.height,
  },
  section: {
    maxWidth: Space.space15,
  },
  sectionExtraPadding: {
    padding: Space.space4 - Space.space3,
  },
  // containerExtraPadding: {
  //   padding: Space.space4 - Space.space3,
  //   paddingTop: NavbarNative.height + (Space.space4 - Space.space3),
  // },
});
