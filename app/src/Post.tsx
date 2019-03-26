import {BodyText, Color, LabelText, MetaText, Space} from "./atoms";
import {Platform, ScrollView, StyleSheet, View} from "react-native";
import React, {useState} from "react";
import {AccountAvatar} from "./AccountAvatar";
import {AccountCache} from "./cache/AccountCache";
import {GroupCache} from "./cache/GroupCache";
import {NavbarNative} from "./NavbarNative";
import {PostCache} from "./cache/PostCache";
import {PostID} from "@connect/api-client";
import {Route} from "./router/Route";
import {communicateTime} from "./communicateTime";
import {useCacheData} from "./cache/framework/Cache";

export function Post({
  route,
  groupSlug,
  postID,
}: {
  route: Route;
  groupSlug: string;
  postID: PostID;
}) {
  const {group} = useCacheData(GroupCache, groupSlug);
  const post = useCacheData(PostCache, postID);
  const author = useCacheData(AccountCache, post.authorID);

  const [hideNavbarBackground, setHideNavbarBackground] = useState(true);

  // NOTE: `new Date()` is a side-effect in render! Ideally we would use
  // `useEffect()` to watch for when the time changes, but this is good enough
  // for now.
  const publishedAt = communicateTime(new Date(), new Date(post.publishedAt));

  return (
    <>
      <NavbarNative
        title={group.name}
        leftIcon="arrow-left"
        onLeftIconPress={() => route.pop()}
        hideBackground={hideNavbarBackground}
      />
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
        <View style={styles.header}>
          <AccountAvatar account={author} />
          <View style={styles.headerInfo}>
            <LabelText>{author.name}</LabelText>
            <MetaText>{publishedAt}</MetaText>
          </View>
        </View>
        <View style={styles.content}>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
          <BodyText>{post.content}</BodyText>
        </View>
      </ScrollView>
    </>
  );
}

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
    paddingTop: NavbarNative.height + Space.space3,
    padding: Space.space3,
  },
  header: {
    flexDirection: "row",
    paddingBottom: Space.space3,
  },
  headerInfo: {
    paddingLeft: Space.space3,
  },
  content: {
    maxWidth: Space.space14,
  },
});
