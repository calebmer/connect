import {
  Animated,
  Platform,
  SectionBase,
  SectionList,
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from "react-native";
import {Color, Font, IconName, Space} from "../atoms";
import {CurrentAccountCache, useCurrentAccount} from "../account/AccountCache";
import {
  GroupPostsCache,
  GroupPostsCacheEntry,
  postCountInitial,
  postCountMore,
} from "../post/PostCache";
import {PostID, Group as _Group} from "@connect/api-client";
import React, {useCallback, useMemo, useRef, useState} from "react";
import {ReadonlyMutable, useMutableContainer} from "../cache/Mutable";
import {AccountHomeAlphaRoute} from "../router/AllRoutes";
import {ErrorBoundary} from "../frame/ErrorBoundary";
import {GroupBanner} from "./GroupBanner";
import {GroupItemFeed} from "./GroupItemFeed";
import {GroupPostPrompt} from "./GroupPostPrompt";
import {IconPatch} from "../molecules/IconPatch";
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
  style,
  route,
  group,
  posts,
  selectedPostID,
  loadingMorePosts,
  onLoadMorePosts,
}: {
  style?: StyleProp<ViewStyle>;
  route: Route;
  group: Group;
  posts: ReadonlyArray<GroupPostsCacheEntry>;
  selectedPostID: ReadonlyMutable<PostID | undefined>;
  loadingMorePosts: boolean;
  onLoadMorePosts: (count: number) => void;
}) {
  // Keep a reference to our scroll view.
  const scrollView = useRef<any>(null);

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

  // Let’s model the group banner animation with math to understand how we get
  // to these equations.
  //
  // Let `x` be the number of pixels of “overflow” we’ve scrolled. That means
  // the number of pixels between the top of the scroll view and the top of the
  // window when the top of the scroll view is _below_ the top of the window.
  //
  // In code that means take the `scrollY` position, negate it, and clamp it
  // to zero.
  //
  // Let `c` be the original height of our group banner.
  //
  // The height of our group banner at any point in time can be modeled by
  // the equation: `f(x) = x + c`. That is the height of our group banner is
  // the original height (`c`) plus any extra overflow pixels (`x`).
  //
  // To get the scale of our banner at any point in time we need: `f(x) / c`.
  // That implies when `x = c` (we’ve scrolled a whole extra banner in overflow)
  // we’ll need to scale our banner by a factor of 2.
  //
  // We scale our banner from the middle so then we need to translate the banner
  // so it actually fills the overflow space. The transform origin is the center
  // of the banner.
  const bannerProgress =
    adjustedContentInsetTop === null
      ? 0
      : Animated.multiply(
          // iOS is weird so we have to factor in the adjusted content inset.
          Animated.add(scrollY, adjustedContentInsetTop),
          -1,
        ).interpolate({
          inputRange: [0, 100],
          outputRange: [0, 100],
          extrapolateLeft: "clamp",
          extrapolateRight: "extend",
        });
  const bannerScale = Animated.add(
    Animated.divide(bannerProgress, GroupBanner.height),
    1,
  );
  const bannerTranslate = Animated.divide(bannerProgress, 2);

  // Are we using the mobile group home layout?
  const stickyNavbar = !useGroupHomeLayout();

  // Have we scrolled our group content enough so that we overlap the navbar?
  // Usually there is space between the navbar and the content thanks to the
  // group, but once we scroll past the group we need to change the
  // navbar’s style.
  const [scrollOverlapsNavbar, setScrollOverlapsNavbar] = useState(false);

  function handleNavbarLeftIconPress() {
    // On web, popping is un-predictable so instead we will push the
    // account home route which is where we expect the user would go
    // on native.
    if (Platform.OS === "web") {
      route.push(AccountHomeAlphaRoute, {});
    } else {
      route.pop();
    }
  }

  // All the section data that our list will render. Memoized to avoid
  // unnecessary calculations in the virtualized list.
  const sections = useMemo(() => {
    // The inbox section of our `<SectionList>`. Contains messages that are
    // relevant to the signed in user.
    const inboxSection: GroupSectionListData<null> = {
      title: "Inbox",
      titleIcon: "inbox",
      hasContent: false,
      data: [null],
      keyExtractor: item => String(item),
      renderItem: () => <GroupInboxEmpty />,
    };

    // The feed section of our `<SectionList>`. Contains all the posts from the
    // group in reverse chronological order.
    const feedSection: GroupSectionListData<GroupPostsCacheEntry> = {
      title: "Feed",
      titleIcon: "rss",
      hasContent: posts.length > 0,
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
      lastSection: inboxSection,
    };

    return [inboxSection, feedSection];
  }, [group, posts, route, selectedPostID]);

  return (
    <View style={[styles.container, style]}>
      {/* The banner which exists in the background of the view. */}
      <Animated.View
        style={[
          styles.banner,
          {transform: [{translateY: bannerTranslate}, {scale: bannerScale}]},
        ]}
      >
        <GroupBanner group={group} />
      </Animated.View>

      {/* Include the navbar but only on mobile. */}
      {stickyNavbar ? (
        <Navbar
          title={group.name}
          leftIcon="arrow-left"
          onLeftIconPress={handleNavbarLeftIconPress}
          hideBackground={!scrollOverlapsNavbar}
          hideTitleWithBackground
          lightContentWithoutBackground
        />
      ) : (
        <Navbar
          leftIcon="arrow-left"
          onLeftIconPress={handleNavbarLeftIconPress}
          hideBackground
          lightContentWithoutBackground
          zIndex={scrollOverlapsNavbar ? 0 : Navbar.zIndex}
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
        onEndReached={useCallback(() => {
          return onLoadMorePosts(postCountMore);
        }, [onLoadMorePosts])}
        // Components for rendering various parts of the group section list
        // layout. Our list design is more stylized then standard native list
        // designs, so we have to jump through some hoops.
        ListHeaderComponent={useMemo(() => {
          return <GroupHeader route={route} group={group} />;
        }, [group, route])}
        ListFooterComponent={useMemo(() => {
          return (
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
          );
        }, [adjustedContentInsetTop, loadingMorePosts])}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={GroupSectionHeader as any}
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
        scrollIndicatorInsets={useMemo(
          () => ({top: stickyNavbar ? Navbar.height : 0}),
          [stickyNavbar],
        )}
        scrollEventThrottle={Platform.OS === "web" ? 16 : 1}
        onScroll={useMemo(() => {
          return Animated.event(
            [{nativeEvent: {contentOffset: {y: scrollY}}}],
            {
              useNativeDriver: Platform.OS !== "web",
              listener: (event: any) => {
                // On iOS, `adjustedContentInset` factors in the top and bottom
                // safe area.
                const contentInsetTop = getAdjustedContentInsetTop(event);

                // Set our adjusted content inset state...
                setAdjustedContentInsetTop(contentInsetTop);

                // Measure whether or not we are now overlapping the navbar.
                setScrollOverlapsNavbar(
                  event.nativeEvent.contentOffset.y + contentInsetTop >=
                    GroupBanner.height - Navbar.height,
                );
              },
            },
          );
        }, [scrollY])}
      />
    </View>
  );
}

const GroupMemo = React.memo(Group);
export {GroupMemo as Group};

/**
 * The data for a section in our group.
 */
interface GroupSectionListData<Data> extends SectionBase<Data> {
  /**
   * The title of our group section.
   */
  readonly title: string;
  /**
   * An icon for the title of our section.
   */
  readonly titleIcon: IconName;
  /**
   * Does this section have some elevated content? If yes then we need to render
   * appropriate shadows.
   */
  readonly hasContent: boolean;
  /**
   * The section before ours. Useful when we need to change our rendering based
   * on the last section.
   */
  readonly lastSection?: GroupSectionListData<any>;
}

/**
 * Component we use for a group’s route. It does data loading instead of letting
 * the parent component do data loading.
 */
function GroupRoute({route, group}: {route: Route; group: Group}) {
  // Always preload the current account...
  CurrentAccountCache.preload();

  // Load the data we need for our group.
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

function GroupRouteContainer({
  route,
  groupSlug,
}: {
  route: Route;
  groupSlug: string;
}) {
  const group = useGroupWithSlug(groupSlug);

  return (
    <ErrorBoundary
      route={route}
      onRetry={() => GroupPostsCache.forceReload(group.id)}
    >
      <GroupRoute route={route} group={group} />
    </ErrorBoundary>
  );
}

export {GroupRouteContainer as GroupRoute};

function GroupHeader({route, group}: {route: Route; group: Group}) {
  const currentAccount = useCurrentAccount();
  return (
    <View style={styles.header} pointerEvents="box-none">
      <GroupPostPrompt route={route} group={group} account={currentAccount} />
    </View>
  );
}

function GroupSectionHeader({
  section,
}: {
  section: GroupSectionListData<unknown>;
}) {
  const {lastSection} = section;
  return (
    <Trough
      title={section.title}
      icon={section.titleIcon}
      hideBottomShadow={!section.hasContent}
      hideTopShadow={lastSection && !lastSection.hasContent}
    />
  );
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

function GroupInboxEmpty() {
  // Make this fun with a dancing animation?
  return (
    <View style={styles.inboxEmpty}>
      <Text style={styles.inboxEmptyText}>
        <Text style={styles.inboxEmptyTextBold}>You’re all caught up!</Text>
        {"\n"}
        Updates for conversations you take part in will appear here.
      </Text>
      <IconPatch icon="check" theme="stamp" />
    </View>
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
  inboxEmpty: {
    flexDirection: "row",
    paddingLeft: Space.space3,
    paddingRight: Space.space4,
    paddingBottom: Space.space4,
    backgroundColor: Trough.backgroundColor,
  },
  inboxEmptyText: {
    flex: 1,
    marginRight: Space.space3,
    color: Color.grey7,
    ...Font.serif,
    ...Font.size2,
    lineHeight: Font.size2.fontSize * 1.3,
  },
  inboxEmptyTextBold: {
    color: Color.grey8,
    ...Font.serifBold,
  },
});
