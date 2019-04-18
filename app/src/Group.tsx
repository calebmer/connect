import {
  Animated,
  Platform,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {Color, Font, Loading, Space} from "./atoms";
import {CurrentAccountCache, useCurrentAccount} from "./cache/AccountCache";
import {GroupHomeLayout, GroupHomeLayoutContext} from "./GroupHomeLayout";
import {
  PostCacheList,
  PostCacheListEntry,
  postCountInitial,
  postCountMore,
} from "./cache/PostCache";
import {PostID, Group as _Group} from "@connect/api-client";
import React, {useContext, useMemo, useRef, useState} from "react";
import {ReadonlyMutable, useMutableContainer} from "./cache/framework/Mutable";
import {GroupBanner} from "./GroupBanner";
import {GroupCache} from "./cache/GroupCache";
import {GroupItemFeed} from "./GroupItemFeed";
import {GroupPostPrompt} from "./GroupPostPrompt";
import {Navbar} from "./Navbar";
import {Route} from "./router/Route";
import {Trough} from "./Trough";
import {useAnimatedValue} from "./useAnimatedValue";
import {useCacheData} from "./cache/framework/Cache";
import {useCacheListData} from "./cache/framework/CacheList";
import {useCacheSingletonData} from "./cache/framework/CacheSingleton";
import {useNewPosts} from "./useNewPosts";

// NOTE: Having a React component and a type with the same name is ok in
// TypeScript, but eslint complains when it’s an import. So import the type with
// a different name and alias it here.
type Group = _Group;

// NOTE: `Animated.SectionList` is typed as `any` so give it a proper type!
const AnimatedSectionList: SectionList<
  unknown
> = Animated.createAnimatedComponent(SectionList);

// TODO: Fix virtualization on web. https://github.com/necolas/react-native-web/issues/1295
function Group({
  route,
  group,
  posts: _posts,
  selectedPostID,
  loadingMorePosts,
  onLoadMorePosts,
}: {
  route: Route;
  group: Group;
  posts: ReadonlyArray<PostCacheListEntry>;
  selectedPostID: ReadonlyMutable<PostID | undefined>;
  loadingMorePosts: boolean;
  onLoadMorePosts: (count: number) => Promise<unknown>;
}) {
  // Keep a reference to our scroll view.
  const scrollView = useRef<any>(null);

  // Are we using the mobile group home layout?
  const showNavbar =
    useContext(GroupHomeLayoutContext) === GroupHomeLayout.Mobile;

  // On iOS you can scroll up which results in a negative value for `scrollY`.
  // When that happens we want to scale up our group banner so that it
  // fills in the extra space. That’s what the `bannerScale` value is for. It
  // translates a negative scroll offset into a scale transformation.
  //
  // There’s some weirdness on iOS where where `scrollY` starts at some negative
  // value like -20 (or -44 on an iPhone X) instead of 0, so we record the first
  // value of `scrollY` and use it as an offset.
  const scrollY = useAnimatedValue(0);
  const [offsetScrollY, setOffsetScrollY] = useState<null | number>(
    Platform.OS === "ios" ? null : 0,
  );
  const bannerScale =
    offsetScrollY === null
      ? 1
      : scrollY.interpolate({
          inputRange: [-GroupBanner.height, 0].map(y => y + offsetScrollY),
          outputRange: [2.8, 1], // NOTE: I would expect this number to be 2 and not 2.8, but experimental evidence proves otherwise.
          extrapolateLeft: "extend",
          extrapolateRight: "clamp",
        });

  // Should we show the navbar or not?
  const [showNavbarBackground, setShowNavbarBackground] = useState(false);

  // Make sure to include all the new posts in our post list.
  const posts = useNewPosts(group.id, _posts);

  // All the section data that our list will render. Memoized to avoid
  // unnecessary calculations in the virtualized list.
  const sections = useMemo(() => {
    // TODO:
    // const inboxSection: SectionListData<InboxItem> = {
    //   title: "Inbox",
    //   data: MockData.inbox,
    //   keyExtractor: item => String(item.id),
    //   renderItem: ({item}) => <GroupInboxItem item={item} />,
    // };

    // The feed section of our `<SectionList>`. Contains all the posts from the
    // group in reverse chronological order.
    const feedSection: SectionListData<PostID> = {
      title: "Feed",
      data: posts as Array<PostID>,
      keyExtractor: id => String(id),
      renderItem: ({item: postID}) => (
        <GroupItemFeed
          route={route}
          groupSlug={group.slug}
          postID={postID}
          selectedPostID={selectedPostID}
        />
      ),
    };

    return [feedSection];
  }, [group.slug, posts, route, selectedPostID]);

  return (
    <View style={styles.container}>
      {/* The banner which exists in the background of the view. */}
      <Animated.View
        // TODO: Scale background only instead of background and text? Only do
        // this when we have a background image to test against.
        style={[styles.banner, {transform: [{scale: bannerScale}]}]}
      >
        <GroupBanner group={group} />
      </Animated.View>

      {/* Include the navbar but only on mobile. */}
      {showNavbar && (
        <Navbar
          title={group.name}
          hideBackground={!showNavbarBackground}
          hideTitleWithBackground
          lightContentWithoutBackground
        />
      )}

      {/* All the scrollable content in the group. This is a scroll view which
       * will scroll above the group banner. */}
      <AnimatedSectionList
        ref={scrollView}
        // The section list data!
        sections={sections as any}
        // Loading more data when the end of the list is reached.
        //
        // NOTE: An `initialNumToRender` that is too small will
        // trigger `onEndReached` when this list initially renders.
        initialNumToRender={postCountInitial}
        onEndReachedThreshold={0.3}
        onEndReached={() => onLoadMorePosts(postCountMore)}
        // Components for rendering various parts of the group section list
        // layout. Our list design is more stylized then standard native list
        // designs, so we have to jump through some hoops.
        ListHeaderComponent={
          <GroupHeader route={route} groupSlug={group.slug} />
        }
        ListFooterComponent={
          <GroupFooter
            loadingMorePosts={loadingMorePosts}
            onScrollToTop={() => {
              if (scrollView.current) {
                scrollView.current
                  .getNode()
                  .getScrollResponder()
                  .scrollTo({y: 0, animated: false});
              }
            }}
          />
        }
        stickySectionHeadersEnabled={false}
        renderSectionHeader={GroupSectionHeader}
        // Watch scroll events and keep track of:
        //
        // - The starting Y offset for our scroll view.
        // - An animated value representing the scroll Y position.
        // - Whether or not we should show our navbar on mobile devices.
        //
        // NOTE: On web we use a much slower `scrollEventThrottle` since we
        // don’t need near-realtime animations attached to scrolling. Also, on
        // native we can use the native animation driver. We don’t have that
        // luxury on web.
        scrollIndicatorInsets={{top: showNavbar ? Navbar.height : 0}}
        scrollEventThrottle={Platform.OS === "web" ? 16 : 1}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {
            useNativeDriver: Platform.OS !== "web",
            listener: (event: any) => {
              if (showNavbar) {
                // If we don’t yet have an `offsetScrollY` value then set one!
                if (offsetScrollY === null) {
                  setOffsetScrollY(event.nativeEvent.contentOffset.y);
                }

                // We should show the navbar when scrolling anymore would mean
                // scrolling under the navbar.
                const shouldShowNavbarBackground =
                  event.nativeEvent.contentOffset.y - (offsetScrollY || 0) >=
                  GroupBanner.height - Navbar.height;

                // Update our navbar state depending on whether we should or
                // should not show the navbar.
                setShowNavbarBackground(shouldShowNavbarBackground);
              }
            },
          },
        )}
      />
    </View>
  );
}

const GroupMemo = React.memo(Group);
export {GroupMemo as Group};

/**
 * Component we use for a group’s route. It does data loading instead of letting
 * the parent component do data loading.
 */
export function GroupRoute({
  route,
  groupSlug,
}: {
  route: Route;
  groupSlug: string;
}) {
  // Always preload the current account...
  CurrentAccountCache.preload();

  // Load the data we need for our group.
  const group = useCacheData(GroupCache, groupSlug);
  const postCacheList = useCacheData(PostCacheList, group.id);
  const {loading, items: posts} = useCacheListData(postCacheList);

  // NOTE: `<ScrollView>` on native doesn’t really like being re-rendered with
  // Suspense. So make sure that the current account is loaded *before*
  // rendering our `<ScrollView>`.
  useCacheSingletonData(CurrentAccountCache);

  return (
    <Group
      route={route}
      group={group}
      posts={posts}
      selectedPostID={useMutableContainer(undefined)}
      loadingMorePosts={loading}
      onLoadMorePosts={count => postCacheList.loadNext(count)}
    />
  );
}

function GroupHeader({route, groupSlug}: {route: Route; groupSlug: string}) {
  const currentAccount = useCurrentAccount();
  return (
    <View style={styles.header}>
      <GroupPostPrompt
        route={route}
        groupSlug={groupSlug}
        account={currentAccount}
      />
    </View>
  );
}

function GroupSectionHeader({
  section: {title},
}: {
  section: SectionListData<unknown>;
}) {
  return <Trough title={title} />;
}

function GroupFooter({
  loadingMorePosts,
  onScrollToTop,
}: {
  loadingMorePosts: boolean;
  onScrollToTop: () => void;
}) {
  return (
    <Trough hideBottomShadow>
      <View style={styles.footer}>
        {loadingMorePosts ? (
          <Loading />
        ) : (
          // Decoration for the end of our list.
          <TouchableOpacity onPress={onScrollToTop}>
            <Text style={styles.footerText}>Back to top ↑</Text>
          </TouchableOpacity>
        )}
      </View>
    </Trough>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    flex: 1,
    position: "relative",
    width: "100%",
    maxWidth: GroupBanner.maxWidth,
    backgroundColor: Trough.backgroundColor,
  },
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    marginTop: GroupBanner.height,
  },
  footer: {
    flexDirection: "column",
    justifyContent: "center",
    height: Loading.size + Space.space3 * 2,
  },
  footerText: {
    color: Color.grey6,
    textAlign: "center",
    ...Font.sans,
    ...Font.size1,
  },
});
