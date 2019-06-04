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
import {Color, Font, Space} from "../atoms";
import {CurrentAccountCache, useCurrentAccount} from "../account/AccountCache";
import {
  GroupPostsCache,
  GroupPostsCacheEntry,
  postCountInitial,
  postCountMore,
} from "../post/PostCache";
import {PostID, Group as _Group} from "@connect/api-client";
import React, {useMemo, useRef, useState} from "react";
import {ReadonlyMutable, useMutableContainer} from "../cache/Mutable";
import {AccountHomeAlphaRoute} from "../router/AllRoutes";
import {GroupBanner} from "./GroupBanner";
import {GroupItemFeed} from "./GroupItemFeed";
import {GroupPostPrompt} from "./GroupPostPrompt";
import {Loading} from "../molecules/Loading";
import {Navbar} from "../frame/Navbar";
import {Route} from "../router/Route";
import {Trough} from "../molecules/Trough";
import {getAdjustedContentInsetTop} from "../utils/getAdjustedContentInset";
import {useAnimatedValue} from "../utils/useAnimatedValue";
import {useCacheSingletonData} from "../cache/CacheSingleton";
import {useCacheWithPrev} from "../cache/Cache";
import {useGroupHomeLayout} from "./useGroupHomeLayout";
import {useGroupWithSlug} from "./GroupCache";

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
  posts,
  selectedPostID,
  loadingMorePosts,
  onLoadMorePosts,
}: {
  route: Route;
  group: Group;
  posts: ReadonlyArray<GroupPostsCacheEntry>;
  selectedPostID: ReadonlyMutable<PostID | undefined>;
  loadingMorePosts: boolean;
  onLoadMorePosts: (count: number) => void;
}) {
  // Keep a reference to our scroll view.
  const scrollView = useRef<any>(null);

  // Are we using the mobile group home layout?
  const showNavbar = !useGroupHomeLayout();

  // On iOS the top of the content is not zero! It is
  // `-adjustedContentInset.top`. `adjustedContentInset` is `contentInset` plus
  // some safe area as determined by `contentInsetAdjustmentBehavior`. So say
  // we have an iPhone X which has a notch. The notch is given a 44pt safe area.
  // That means `adjustedContentInset.top` is 44 so the top of our scroll view
  // is -44.
  const scrollY = useAnimatedValue(0);
  const [adjustedContentInsetTop, setAdjustedContentInsetTop] = useState(
    Platform.OS === "ios" ? null : 0,
  );
  const bannerScale =
    adjustedContentInsetTop === null
      ? 1
      : scrollY.interpolate({
          inputRange: [-GroupBanner.height, 0].map(
            y => y - adjustedContentInsetTop,
          ),
          outputRange: [2.8, 1], // NOTE: I would expect this number to be 2 and not 2.8, but experimental evidence proves otherwise.
          extrapolateLeft: "extend",
          extrapolateRight: "clamp",
        });

  // Should we show the navbar or not?
  const [showNavbarBackground, setShowNavbarBackground] = useState(false);

  // All the section data that our list will render. Memoized to avoid
  // unnecessary calculations in the virtualized list.
  const sections = useMemo(() => {
    // The feed section of our `<SectionList>`. Contains all the posts from the
    // group in reverse chronological order.
    const feedSection: SectionListData<GroupPostsCacheEntry> = {
      title: "Feed",
      data: posts as Array<GroupPostsCacheEntry>,
      keyExtractor: post => String(post.id),
      renderItem: ({item: {id: postID}}) => (
        <GroupItemFeed
          route={route}
          group={group}
          postID={postID}
          selectedPostID={selectedPostID}
        />
      ),
    };

    return [feedSection];
  }, [group, posts, route, selectedPostID]);

  return (
    <View style={styles.container}>
      {/* The banner which exists in the background of the view. */}
      <Animated.View
        // TODO: Scale background only instead of background and text? Only do
        // this when we have a background image to test against.
        //
        // TODO: Scale and translate. We can translate the banner down while
        // scaling so it needs to grow less.
        style={[styles.banner, {transform: [{scale: bannerScale}]}]}
      >
        <GroupBanner group={group} />
      </Animated.View>

      {/* Include the navbar but only on mobile. */}
      {showNavbar && (
        <Navbar
          title={group.name}
          leftIcon="arrow-left"
          onLeftIconPress={() => {
            // On web, popping is un-predictable so instead we will push the
            // account home route which is where we expect the user would go
            // on native.
            if (Platform.OS === "web") {
              route.push(AccountHomeAlphaRoute, {});
            } else {
              route.pop();
            }
          }}
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
        ListHeaderComponent={<GroupHeader route={route} group={group} />}
        ListFooterComponent={
          <GroupFooter
            loadingMorePosts={loadingMorePosts}
            onScrollToTop={() => {
              if (scrollView.current) {
                scrollView.current
                  .getNode()
                  .getScrollResponder()
                  .scrollTo({
                    y: -(adjustedContentInsetTop || 0),
                    animated: false,
                  });
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
                // On iOS, `adjustedContentInset` factors in the top and bottom
                // safe area.
                const eventAdjustedContentInsetTop = getAdjustedContentInsetTop(
                  event,
                );

                // Set our adjusted content inset state...
                setAdjustedContentInsetTop(eventAdjustedContentInsetTop);

                // We should show the navbar when scrolling anymore would mean
                // scrolling under the navbar.
                const shouldShowNavbarBackground =
                  event.nativeEvent.contentOffset.y +
                    eventAdjustedContentInsetTop >=
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
  const group = useGroupWithSlug(groupSlug);
  const {loading, data: posts} = useCacheWithPrev(GroupPostsCache, group.id);

  // NOTE: `<ScrollView>` on native doesn’t really like being re-rendered with
  // Suspense. So make sure that the current account is loaded *before*
  // rendering our `<ScrollView>`.
  useCacheSingletonData(CurrentAccountCache);

  return (
    <Group
      route={route}
      group={group}
      posts={posts.items}
      selectedPostID={useMutableContainer(undefined)}
      loadingMorePosts={!posts.noMoreItems || loading}
      onLoadMorePosts={count => {
        if (!GroupPostsCache.isLoading(group.id))
          GroupPostsCache.updateWhenReady(group.id, posts => {
            return posts.loadMore(count);
          });
      }}
    />
  );
}

function GroupHeader({route, group}: {route: Route; group: Group}) {
  const currentAccount = useCurrentAccount();
  return (
    <View style={styles.header}>
      <GroupPostPrompt route={route} group={group} account={currentAccount} />
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
