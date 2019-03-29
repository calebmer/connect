import {Color, Space} from "./atoms";
import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import {Platform, ScrollView, StyleSheet, View} from "react-native";
import React, {useContext, useState} from "react";
import {Trough, TroughTitle} from "./Trough";
import {GroupCache} from "./cache/GroupCache";
import {NavbarNative} from "./NavbarNative";
import {PostComments} from "./PostComments";
import {PostContent} from "./PostContent";
import {PostID} from "@connect/api-client";
import {Route} from "./router/Route";
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
      <PostNavbarNative
        route={route}
        groupSlug={groupSlug}
        hideBackground={hideNavbarBackground}
      />
      <ScrollView
        style={styles.background}
        scrollIndicatorInsets={scrollIndicatorInsets}
        scrollEventThrottle={16}
        onScroll={event => {
          if (Platform.OS !== "web") {
            setHideNavbarBackground(event.nativeEvent.contentOffset.y <= 0);
          }
        }}
      >
        <View style={isLaptop ? styles.postLaptop : styles.postMobile}>
          <PostContent postID={postID} />
        </View>
        <Trough>
          <TroughTitle
            style={
              isLaptop ? styles.commentsTitleLaptop : styles.commentsTitleMobile
            }
          >
            Comments
          </TroughTitle>
        </Trough>
        <PostComments postID={postID} />
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

const paddingMobile = Space.space3;
const paddingLaptop = Space.space4;

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Color.white,
  },
  postMobile: {
    paddingTop: NavbarNative.height + paddingMobile,
    paddingBottom: paddingMobile,
    paddingHorizontal: paddingMobile,
  },
  postLaptop: {
    paddingTop: NavbarNative.height + paddingLaptop,
    paddingBottom: paddingLaptop,
    paddingHorizontal: paddingLaptop,
  },
  commentsTitleMobile: {
    paddingHorizontal: paddingMobile,
  },
  commentsTitleLaptop: {
    paddingHorizontal: paddingLaptop,
  },
});
