import * as MockData from "./MockData";
import {
  Animated,
  Platform,
  SectionList,
  SectionListData,
  StyleSheet,
  View,
} from "react-native";
import {Border, Color, Shadow, Space} from "./atoms";
import {InboxItem, Post} from "./MockData";
import React, {useState} from "react";
import {GroupBanner} from "./GroupBanner";
import {GroupItemFeed} from "./GroupItemFeed";
import {GroupItemInbox} from "./GroupItemInbox";
import {GroupPostPrompt} from "./GroupPostPrompt";
import {GroupSectionHeader} from "./GroupSectionHeader";
import {Route} from "./router";
import {useNavigationTopBar} from "./useNavigationTopBar";

const currentAccount = MockData.calebMeredith;

// NOTE: `Animated.SectionList` is typed as `any` so give it a proper type!
const AnimatedSectionList: SectionList<
  unknown
> = Animated.createAnimatedComponent(SectionList);

export function Group({route}: {route: Route}) {
  const groupTitle = "Definitely Work";

  // On iOS you can scroll up which results in a negative value for `scrollY`.
  // When that happens we want to scale up our group banner so that it
  // fills in the extra space. That’s what the `bannerScale` value is for. It
  // translates a negative scroll offset into a scale transformation.
  //
  // There’s some weirdness on iOS where where `scrollY` starts at some negative
  // value like -44 on an iPhone X instead of 0, so we record the first value of
  // `scrollY` and use it as an offset.
  const [scrollY] = useState(new Animated.Value(0));
  const [offsetScrollY, setOffsetScrollY] = useState<null | number>(null);
  const bannerScale =
    offsetScrollY === null
      ? 1
      : scrollY.interpolate({
          inputRange: [-GroupBanner.height, 0].map(y => y + offsetScrollY),
          outputRange: [2.7, 1], // NOTE: I would expect this number to be 2 and not 2.7, but experimental evidence proves otherwise.
          extrapolateLeft: "extend",
          extrapolateRight: "clamp",
        });

  // Keep track of whether or not we should show the native top bar. We have a
  // hook, `useNavigationTopBar()` that allows us to manage it.
  const [showTopBar, setShowTopBar] = useState(false);
  useNavigationTopBar({route, visible: showTopBar});

  const inboxSection: SectionListData<InboxItem> = {
    title: "Inbox",
    data: MockData.inbox,
    keyExtractor: item => String(item.id),
    renderItem: ({item}) => <GroupItemInbox item={item} />,
  };

  const feedSection: SectionListData<Post> = {
    title: "Feed",
    data: [...MockData.feed, ...MockData.feed, ...MockData.feed].map(
      (item, id) => ({...item, id}),
    ),
    keyExtractor: item => String(item.id),
    renderItem: ({item}) => <GroupItemFeed post={item} />,
  };

  return (
    <View style={styles.container}>
      {/* The banner which exists in the background of the view. */}
      <Animated.View
        // TODO: Scale background only instead of background and text? Only do
        // this when we have a background image to test against.
        style={[styles.banner, {transform: [{scale: bannerScale}]}]}
      >
        <GroupBanner title={groupTitle} />
      </Animated.View>

      {/* All the scrollable content in the group. This is a scroll view which
       * will scroll above the group banner. */}
      <AnimatedSectionList
        // The section list data!
        sections={[inboxSection, feedSection] as any}
        // Components for rendering various parts of the group section list
        // layout. Our list design is more stylized then standard native list
        // designs, so we have to jump through some hoops.
        ListHeaderComponent={GroupHeader}
        ListFooterComponent={GroupFooter}
        stickySectionHeadersEnabled
        renderSectionHeader={GroupSectionHeaderWrapper}
        SectionSeparatorComponent={GroupSectionSeparatorWrapper}
        ItemSeparatorComponent={GroupItemSeparator}
        // Watch scroll events and keep track of:
        //
        // - The starting Y offset for our scroll view.
        // - An animated value representing the scroll Y position.
        // - Whether or not we should show our navbar on mobile devices.
        scrollEventThrottle={16}
        onScrollBeginDrag={event => {
          if (offsetScrollY === null) {
            setOffsetScrollY(event.nativeEvent.contentOffset.y);
          }
        }}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {
            // Always use the native driver for animations when possible. Except
            // you get warnings when trying to use the native driver on web.
            useNativeDriver: Platform.OS !== "web",

            listener: (event: any) => {
              // We should show the navbar when we’ve scrolled past X% of the
              // group banner’s height.
              const shouldShowNavBar =
                event.nativeEvent.contentOffset.y + (offsetScrollY || 0) >=
                GroupBanner.height * 0.1;

              // If `shouldShowNavBar` is different from `showNavBar` then
              // enqueue an update to change `showNavBar`.
              if (shouldShowNavBar !== showTopBar) {
                setShowTopBar(shouldShowNavBar);
              }
            },
          },
        )}
      />
    </View>
  );
}

function GroupHeader() {
  return (
    <>
      <View style={styles.header}>
        <GroupPostPrompt account={currentAccount} />
        <View style={styles.headerSpace} />
        <GroupSectionSeparator isLeading noBackground />
      </View>
    </>
  );
}

function GroupFooter() {
  return <View style={styles.footerSpace} />;
}

function GroupSectionHeaderWrapper({
  section: {title},
}: {
  section: SectionListData<unknown>;
}) {
  return (
    <>
      <GroupSectionHeader title={title} />
      <GroupItemSeparator />
    </>
  );
}

function GroupSectionSeparatorWrapper({
  leadingItem,
  trailingSection,
}: {
  leadingItem?: unknown;
  trailingSection?: unknown;
}) {
  return leadingItem !== undefined && trailingSection !== undefined ? (
    <>
      <GroupSectionSeparator isTrailing />
      <GroupSectionSeparator isLeading />
    </>
  ) : leadingItem !== undefined ? (
    <GroupSectionSeparator isTrailing />
  ) : null;
}

function GroupSectionSeparator({
  isLeading,
  isTrailing,
  noBackground,
}: {
  isLeading?: boolean;
  isTrailing?: boolean;
  noBackground?: boolean;
}) {
  return (
    <View
      style={[
        styles.sectionSeparator,
        !noBackground && styles.sectionSeparatorBackground,
      ]}
    >
      {isLeading && <View style={styles.sectionSeparatorShadowLeading} />}
      {isTrailing && <View style={styles.sectionSeparatorShadowTrailing} />}
    </View>
  );
}

function GroupItemSeparator() {
  return <View style={styles.separator} />;
}

const backgroundColor = Color.grey0;
const sectionMargin = Space.space6;

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
    backgroundColor,
  },
  headerSpace: {height: sectionMargin / 2},
  footerSpace: {height: sectionMargin / 2},
  separator: {
    height: Border.width1,
    backgroundColor: "hsl(0, 0%, 90%)",
  },
  sectionSeparator: {
    overflow: "hidden",
    height: sectionMargin / 2,
  },
  sectionSeparatorBackground: {
    backgroundColor,
  },
  sectionSeparatorShadowLeading: {
    position: "relative",
    top: sectionMargin / 2,
    height: sectionMargin / 2,
    backgroundColor: "white",
    ...Shadow.elevation1,
  },
  sectionSeparatorShadowTrailing: {
    position: "relative",
    top: -sectionMargin / 2,
    height: sectionMargin / 2,
    backgroundColor: "white",
    ...Shadow.elevation1,
  },
});
