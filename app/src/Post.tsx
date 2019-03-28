import {BodyText, Color, LabelText, MetaText, Space} from "./atoms";
import {Breakpoint, useBreakpoint} from "./useBreakpoint";
import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import {Platform, ScrollView, StyleSheet, View} from "react-native";
import React, {useContext, useState} from "react";
import {Trough, TroughTitle} from "./Trough";
import {AccountAvatar} from "./AccountAvatar";
import {AccountCache} from "./cache/AccountCache";
import {GroupCache} from "./cache/GroupCache";
import {NavbarNative} from "./NavbarNative";
import {PostCache} from "./cache/PostCache";
import {PostID} from "@connect/api-client";
import {Route} from "./router/Route";
import {communicateTime} from "./communicateTime";
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
  const {group} = useCacheData(GroupCache, groupSlug);
  const post = useCacheData(PostCache, postID);
  const author = useCacheData(AccountCache, post.authorID);

  const [hideNavbarBackground, setHideNavbarBackground] = useState(true);

  // Get information about the current screen size.
  const groupHomeLayout = useContext(GroupHomeLayoutContext);
  const breakpoint = useBreakpoint();
  const indentContent = breakpoint >= Breakpoint.LaptopLarge;

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
        scrollIndicatorInsets={scrollIndicatorInsets}
        scrollEventThrottle={16}
        onScroll={event => {
          if (Platform.OS !== "web") {
            setHideNavbarBackground(event.nativeEvent.contentOffset.y <= 0);
          }
        }}
      >
        <View
          style={
            groupHomeLayout === GroupHomeLayout.Laptop
              ? styles.postLaptop
              : styles.postMobile
          }
        >
          <View
            style={[styles.header, indentContent && styles.headerIndentContent]}
          >
            <AccountAvatar account={author} />
            <View style={styles.headerInfo}>
              <LabelText>{author.name}</LabelText>
              <MetaText>{publishedAt}</MetaText>
            </View>
          </View>
          <View
            style={[
              styles.postContent,
              indentContent && styles.postContentIndent,
            ]}
          >
            <BodyText>{post.content}</BodyText>
          </View>
        </View>
        <Trough>
          <TroughTitle
            style={
              groupHomeLayout === GroupHomeLayout.Laptop
                ? styles.commentsTitleLaptop
                : styles.commentsTitleMobile
            }
          >
            Comments
          </TroughTitle>
        </Trough>
      </ScrollView>
    </>
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
  header: {
    flexDirection: "row",
    paddingBottom: Space.space3,
  },
  headerIndentContent: {
    paddingBottom: Space.space1,
  },
  headerInfo: {
    paddingLeft: Space.space3,
  },
  postContent: {
    maxWidth: Space.space15 - Space.space3 * 2,
  },
  postContentIndent: {
    marginLeft: AccountAvatar.size + Space.space3,
  },
  commentsTitleMobile: {
    paddingHorizontal: paddingMobile,
  },
  commentsTitleLaptop: {
    paddingHorizontal: paddingLaptop,
  },
});
