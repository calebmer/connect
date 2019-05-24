import {Border, Font, Space} from "../atoms";
import {StyleSheet, View} from "react-native";
import {AccountAvatar} from "../account/AccountAvatar";
import {CommentConversationShimmer} from "../comment/CommentShimmer";
import React from "react";
import {TextShimmer} from "../molecules/TextShimmer";
import {Trough} from "../molecules/Trough";

/**
 * Mock data for creating a visually interesting post body content shimmer.
 * Roughly taken from two paragraphs of Lorem Ipsum.
 */
const body: ReadonlyArray<ReadonlyArray<number>> = [
  [94, 90, 94, 100, 73],
  [94, 100, 94, 73],
];

export function PostShimmer() {
  return (
    <>
      <View style={styles.header}>
        <View style={styles.avatar} />
        <View style={styles.byline} />
      </View>
      <View style={styles.body}>
        {body.map((lines, paragraphIndex) => (
          <React.Fragment key={paragraphIndex}>
            {paragraphIndex !== 0 && <View style={styles.break} />}
            {lines.map((line, lineIndex) => (
              <TextShimmer key={lineIndex} width={line} />
            ))}
          </React.Fragment>
        ))}
      </View>
      <Trough title="Comments" />
      <CommentConversationShimmer />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    padding: Space.space3,
    paddingBottom: Space.space2,
  },
  avatar: {
    width: AccountAvatar.size,
    height: AccountAvatar.size,
    marginVertical: (Font.size2.lineHeight * 2 - AccountAvatar.size) / 2,
    borderRadius: AccountAvatar.size / 2,
    backgroundColor: TextShimmer.shimmerColor,
  },
  byline: {
    width: "20%",
    height: TextShimmer.lineBarHeight,
    marginVertical: (Font.size2.lineHeight - TextShimmer.lineBarHeight) / 2,
    marginLeft: Space.space3,
    backgroundColor: TextShimmer.shimmerColor,
    borderRadius: Border.radius0,
  },
  body: {
    paddingHorizontal: Space.space3,
    paddingBottom: Space.space3,
  },
  break: {
    height: Font.size2.lineHeight,
  },
});
