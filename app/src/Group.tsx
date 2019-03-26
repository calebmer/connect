import * as MockData from "./MockData";
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
import {Color, Font, Shadow, Space} from "./atoms";
import {
  GroupCache,
  PostCacheListEntry,
  groupPostCountInitial,
  groupPostCountMore,
} from "./cache/GroupCache";
import React, {useMemo, useRef, useState} from "react";
import {GroupBanner} from "./GroupBanner";
import {GroupItem} from "./GroupItem";
import {GroupItemFeed} from "./GroupItemFeed";
import {GroupPostPrompt} from "./GroupPostPrompt";
import {Loading} from "./atoms/Loading";
import {NavbarNative} from "./NavbarNative";
import {Route} from "./router/Route";
import {useCacheData} from "./cache/framework/Cache";
import {useCacheListData} from "./cache/framework/CacheList";

const currentAccount = MockData.calebMeredith;

// NOTE: `Animated.SectionList` is typed as `any` so give it a proper type!
const AnimatedSectionList: SectionList<
  unknown
> = Animated.createAnimatedComponent(SectionList);

// TODO: Investigate why virtualization isn’t working on web.
function GroupComponent({route, groupSlug}: {route: Route; groupSlug: string}) {
  // Load the data we need for our group.
  const {group, postCacheList} = useCacheData(GroupCache, groupSlug);
  const posts = useCacheListData(postCacheList);

  // Keep a reference to our scroll view.
  const scrollView = useRef<any>(null);

  // On iOS you can scroll up which results in a negative value for `scrollY`.
  // When that happens we want to scale up our group banner so that it
  // fills in the extra space. That’s what the `bannerScale` value is for. It
  // translates a negative scroll offset into a scale transformation.
  //
  // There’s some weirdness on iOS where where `scrollY` starts at some negative
  // value like -20 (or -44 on an iPhone X) instead of 0, so we record the first
  // value of `scrollY` and use it as an offset.
  const [scrollY] = useState(new Animated.Value(0));
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
  const [showNavbar, setShowNavbar] = useState(false);

  // Are we loading more posts?
  const [loadingNext, setLoadingNext] = useState(false);

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
    const feedSection: SectionListData<PostCacheListEntry> = {
      title: "Feed",
      data: posts,
      keyExtractor: item => String(item.id),
      renderItem: ({item}) => (
        <GroupItemFeed route={route} groupSlug={groupSlug} postID={item.id} />
      ),
    };

    return [feedSection];
  }, [groupSlug, posts, route]);

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

      {/* Include the navbar. */}
      <NavbarNative
        title={group.name}
        hideBackground={!showNavbar}
        hideTitleWithBackground={true}
      />

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
        initialNumToRender={groupPostCountInitial}
        onEndReachedThreshold={0.3}
        onEndReached={async () => {
          try {
            setLoadingNext(true);
            await postCacheList.loadNext(groupPostCountMore);
          } finally {
            setLoadingNext(false);
          }
        }}
        // Components for rendering various parts of the group section list
        // layout. Our list design is more stylized then standard native list
        // designs, so we have to jump through some hoops.
        ListHeaderComponent={GroupHeader}
        ListFooterComponent={
          <GroupFooter
            loadingNext={loadingNext}
            onScrollTopTop={() => {
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
        SectionSeparatorComponent={GroupSectionSeparatorWrapper}
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
        scrollIndicatorInsets={scrollIndicatorInsets}
        scrollEventThrottle={Platform.OS === "web" ? 500 : 1}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {
            useNativeDriver: Platform.OS !== "web",
            listener: (event: any) => {
              // Skip all this on the web where we don’t need a scroll
              // event listener.
              if (Platform.OS === "web") return;

              // If we don’t yet have an `offsetScrollY` value then set one!
              if (offsetScrollY === null) {
                setOffsetScrollY(event.nativeEvent.contentOffset.y);
              }

              // We should show the navbar when scrolling anymore would mean
              // scrolling under the navbar.
              const shouldShowNavbar =
                event.nativeEvent.contentOffset.y - (offsetScrollY || 0) >=
                GroupBanner.height - NavbarNative.height;

              // Update our navbar state depending on whether we should or
              // should not show the navbar.
              setShowNavbar(shouldShowNavbar);
            },
          },
        )}
      />
    </View>
  );
}

const _Group = React.memo(GroupComponent);
export {_Group as Group};

function GroupHeader() {
  return (
    <View style={styles.header}>
      <GroupPostPrompt account={currentAccount as any} />
    </View>
  );
}

function GroupFooter({
  loadingNext,
  onScrollTopTop,
}: {
  loadingNext: boolean;
  onScrollTopTop: () => void;
}) {
  return (
    <View style={styles.footer}>
      {loadingNext ? (
        <Loading />
      ) : (
        // Decoration for the end of our list.
        <TouchableOpacity onPress={onScrollTopTop}>
          <Text style={styles.footerText}>Back to top ↑</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function GroupSectionHeader({
  section: {title},
}: {
  section: SectionListData<unknown>;
}) {
  return (
    <>
      <View style={styles.sectionHeader}>
        <GroupSectionSeparator isLeading />
        <Text style={styles.sectionHeaderText}>{title}</Text>
      </View>
    </>
  );
}

function GroupSectionSeparatorWrapper({leadingItem}: {leadingItem?: unknown}) {
  return leadingItem !== undefined ? (
    <GroupSectionSeparator isTrailing />
  ) : null;
}

function GroupSectionSeparator({
  isLeading,
  isTrailing,
}: {
  isLeading?: boolean;
  isTrailing?: boolean;
}) {
  return (
    <View style={styles.sectionSeparator}>
      {isLeading && <View style={styles.sectionSeparatorShadowLeading} />}
      {isTrailing && <View style={styles.sectionSeparatorShadowTrailing} />}
    </View>
  );
}

const scrollIndicatorInsets = {top: NavbarNative.height};

const backgroundColor = Color.grey0;
const sectionMargin = Space.space3;

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    flex: 1,
    position: "relative",
    width: "100%",
    maxWidth: GroupBanner.maxWidth,
    backgroundColor,
  },
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  header: {
    marginTop: GroupBanner.height,
    paddingBottom: sectionMargin,
    backgroundColor,
  },
  footer: {
    height: Loading.size + sectionMargin,
  },
  footerText: {
    color: Color.grey6,
    textAlign: "center",
    ...Font.sans,
    ...Font.size1,
    lineHeight: Loading.size,
  },
  sectionHeader: {
    justifyContent: "flex-end",
    height: Font.size1.lineHeight + Space.space0 / 2,
    backgroundColor,
  },
  sectionHeaderText: {
    position: "absolute",
    bottom: 0,
    paddingHorizontal: GroupItem.padding,
    paddingBottom: Space.space0 / 2,
    color: Color.grey6,
    ...Font.sans,
    ...Font.size1,
  },
  sectionSeparator: {
    overflow: "hidden",
    minHeight: sectionMargin,
    backgroundColor,
  },
  sectionSeparatorShadowLeading: {
    position: "relative",
    top: sectionMargin,
    height: sectionMargin,
    backgroundColor: Color.white,
    ...Shadow.elevation0,
  },
  sectionSeparatorShadowTrailing: {
    position: "relative",
    top: -sectionMargin,
    height: sectionMargin,
    backgroundColor: Color.white,
    ...Shadow.elevation0,
  },
});
