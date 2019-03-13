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
import {Border, Color, Font, Shadow, Space} from "./atoms";
import {InboxItem, Post} from "./MockData";
import React, {ReactNode, useState} from "react";
import {GroupBanner} from "./GroupBanner";
import {GroupItemFeed} from "./GroupItemFeed";
import {GroupItemInbox} from "./GroupItemInbox";
import {GroupPostPrompt} from "./GroupPostPrompt";
import {NavbarNative} from "./NavbarNative";

const currentAccount = MockData.calebMeredith;

// NOTE: `Animated.SectionList` is typed as `any` so give it a proper type!
const AnimatedSectionList: SectionList<
  unknown
> = Animated.createAnimatedComponent(SectionList);

export function Group() {
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
        <GroupBanner title={groupTitle} />
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
            useNativeDriver: Platform.OS !== "web",
            listener: (event: any) => {
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
    <View style={styles.sectionHeader}>
      <GroupSectionSeparator isLeading />
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
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
  noBackground,
  children,
}: {
  isLeading?: boolean;
  isTrailing?: boolean;
  noBackground?: boolean;
  children?: ReactNode;
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
      {children}
    </View>
  );
}

const backgroundColor = Color.grey0;
const sectionMargin = Space.space5;

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
    height: Font.size3.lineHeight + Space.space1 * 2,
    backgroundColor,
  },
  sectionHeaderText: {
    position: "absolute",
    bottom: 0,
    paddingVertical: Space.space1,
    paddingHorizontal: Space.space3,
    color: Color.grey6,
    ...Font.sans,
    ...Font.size3,
  },
  sectionSeparator: {
    overflow: "hidden",
    minHeight: sectionMargin,
  },
  sectionSeparatorBackground: {
    backgroundColor,
  },
  sectionSeparatorShadowLeading: {
    position: "relative",
    top: sectionMargin,
    height: sectionMargin,
    backgroundColor: Color.white,
    ...Shadow.elevation1,
  },
  sectionSeparatorShadowTrailing: {
    position: "relative",
    top: -sectionMargin,
    height: sectionMargin,
    backgroundColor: Color.white,
    ...Shadow.elevation1,
  },
});
