import {BodyText, Color, LabelText, MetaText, Space} from "./atoms";
import React, {useState} from "react";
import {ScrollView, StyleSheet, View} from "react-native";
import {AccountAvatar} from "./AccountAvatar";
import {AccountCache} from "./cache/AccountCache";
import {GroupCache} from "./cache/GroupCache";
import {NavbarNative} from "./NavbarNative";
import {PostCache} from "./cache/PostCache";
import {PostID} from "@connect/api-client";
import {communicateTime} from "./communicateTime";
import {useCacheData} from "./cache/framework/Cache";

// TODO:
//
// 2. Native navbar
// 3. Web inbox

export function Post({
  groupSlug,
  postID: _postID,
}: {
  groupSlug: string;
  postID: string;
}) {
  const postID = parseInt(_postID, 10) as PostID;

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
      <NavbarNative title={group.name} hideBackground={hideNavbarBackground} />
      <ScrollView
        style={styles.background}
        contentContainerStyle={styles.container}
        scrollIndicatorInsets={scrollIndicatorInsets}
        scrollEventThrottle={16}
        onScroll={event => {
          setHideNavbarBackground(event.nativeEvent.contentOffset.y <= 0);
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
        </View>
      </ScrollView>
    </>
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
