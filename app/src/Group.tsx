import * as MockData from "./MockData";
import {
  Animated,
  Platform,
  SectionList,
  SectionListData,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {Color, Font, Shadow, Space} from "./atoms";
import {InboxItem, Post} from "./MockData";
import React, {useState} from "react";
import {GroupBanner} from "./GroupBanner";
import {GroupCache} from "./cache/GroupCache";
import {GroupItem} from "./GroupItem";
import {GroupItemFeed} from "./GroupItemFeed";
import {GroupItemInbox} from "./GroupItemInbox";
import {GroupPostPrompt} from "./GroupPostPrompt";
import {NavbarNative} from "./NavbarNative";

const currentAccount = MockData.calebMeredith;

// NOTE: `Animated.SectionList` is typed as `any` so give it a proper type!
const AnimatedSectionList: SectionList<
  unknown
> = Animated.createAnimatedComponent(SectionList);

export function Group({slug}: {slug: string}) {
  const group = GroupCache.useData(slug);

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

  const [showNavbar, setShowNavbar] = useState(false);

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
        <GroupBanner title={group.name} />
      </Animated.View>

      {/* Include the navbar. */}
      <NavbarNative hideBackground={!showNavbar} />

      {/* All the scrollable content in the group. This is a scroll view which
       * will scroll above the group banner. */}
      <AnimatedSectionList
        // The section list data!
        sections={[inboxSection, feedSection] as any}
        // Components for rendering various parts of the group section list
        // layout. Our list design is more stylized then standard native list
        // designs, so we have to jump through some hoops.
        ListHeaderComponent={GroupHeader}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={GroupSectionHeader}
        SectionSeparatorComponent={GroupSectionSeparatorWrapper}
        ItemSeparatorComponent={GroupItemSeparator}
        // Watch scroll events and keep track of:
        //
        // - The starting Y offset for our scroll view.
        // - An animated value representing the scroll Y position.
        // - Whether or not we should show our navbar on mobile devices.
        scrollEventThrottle={1}
        onScroll={Animated.event(
          [{nativeEvent: {contentOffset: {y: scrollY}}}],
          {
            useNativeDriver: Platform.OS !== "web",
            listener: (event: any) => {
              // If we don’t yet have an `offsetScrollY` value then set one!
              if (offsetScrollY === null) {
                setOffsetScrollY(event.nativeEvent.contentOffset.y);
              }

              // We should show the navbar when we’ve scrolled past 40% of the
              // group banner’s height.
              const shouldShowNavbar =
                event.nativeEvent.contentOffset.y - (offsetScrollY || 0) >=
                GroupBanner.height * 0.25;

              // If `shouldShowNavbar` is different from `showNavbar` then
              // enqueue an update to change `showNavbar`.
              if (shouldShowNavbar !== showNavbar) {
                setShowNavbar(shouldShowNavbar);
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
    <View style={styles.header}>
      <GroupPostPrompt account={currentAccount} />
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
  return (
    <>
      <View style={styles.sectionVerticalPadding} />
      {leadingItem !== undefined && <GroupSectionSeparator isTrailing />}
    </>
  );
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

function GroupItemSeparator() {
  return <View style={styles.itemSeparator} />;
}

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
  sectionVerticalPadding: {
    height: GroupItem.padding,
    backgroundColor: GroupItem.backgroundColor,
  },
  itemSeparator: {
    height: GroupItem.padding,
    backgroundColor: GroupItem.backgroundColor,
  },
});
