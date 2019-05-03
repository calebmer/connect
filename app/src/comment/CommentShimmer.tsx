import {Border, Font, Space} from "../atoms";
import React, {ReactElement} from "react";
import {StyleSheet, View} from "react-native";
import {AccountAvatarSmall} from "../account/AccountAvatarSmall";
import {Comment} from "./Comment";

/**
 * The type for the data that makes up a comment shimmer.
 */
type CommentShimmer = {
  readonly byline: boolean;
  readonly lines: ReadonlyArray<number>;
};

/**
 * Mock data for creating a visually interesting comment shimmer conversation.
 * Roughly taken from a conversation in Definitely Work.
 */
const conversation: ReadonlyArray<CommentShimmer> = [
  {byline: true, lines: [84]},
  {byline: true, lines: [12]},
  {byline: false, lines: [37]},
  {byline: true, lines: [100, 57]},
  {byline: false, lines: [100, 12]},
  {byline: true, lines: [100, 88, 37]},
  {byline: true, lines: [92, 100, 65]},
  {byline: false, lines: [92]},
  {byline: true, lines: [38]},
  {byline: true, lines: [63, 56]},
];

let _conversationNodes: ReadonlyArray<ReactElement>;

/**
 * Lazily create all the JSX nodes for our comment shimmer conversation. Turns
 * out otherwise that the comment shimmer is one of our more expensive
 * components to render.
 */
function getConversationNodes() {
  if (_conversationNodes === undefined) {
    _conversationNodes = conversation.map(comment => (
      // eslint-disable-next-line react/jsx-key
      <View
        style={[
          styles.comment,
          comment.byline
            ? styles.commentWithByline
            : styles.commentWithoutByline,
          {height: getHeight(comment)},
        ]}
      >
        <View style={styles.spaceLeft}>
          {comment.byline && <View style={styles.avatar} />}
        </View>
        <View style={styles.body}>
          {comment.byline && <View style={styles.byline} />}
          {comment.lines.map((line, index) => (
            <View key={index} style={[styles.line, {width: `${line}%`}]} />
          ))}
        </View>
      </View>
    ));
  }
  return _conversationNodes;
}

function CommentShimmer({index}: {index: number}) {
  const conversationNodes = getConversationNodes();
  return conversationNodes[index % conversationNodes.length];
}

const _CommentShimmer = Object.assign(React.memo(CommentShimmer), {
  getChunkHeight,
});

export {_CommentShimmer as CommentShimmer};

/**
 * Gets the height of a single comment shimmer.
 */
function getHeight(comment: CommentShimmer): number {
  let height = 0;

  // Add the height for the comment’s top padding.
  height += comment.byline
    ? Comment.paddingTopWithByline
    : Comment.paddingTopWithoutByline;

  // Add the height for the comment’s byline.
  if (comment.byline) {
    height += Font.size2.lineHeight;
  }

  // Add the height for the comment’s content.
  height += comment.lines.length * Font.size2.lineHeight;

  return height;
}

let _conversationHeight: number;

/**
 * Gets the height of a chunk of content shimmers. The chunk has a size of
 * `count`. If the chunk starts on a shimmer other than the shimmer at index 0
 * then we use that.
 */
function getChunkHeight(count: number, startIndex: number = 0): number {
  // Compute the height of a full conversation if we haven’t already.
  if (_conversationHeight === undefined) {
    _conversationHeight = conversation.reduce(
      (height, comment) => height + getHeight(comment),
      0,
    );
  }

  // Start with a height based on the number of shimmer conversations in
  // our chunk
  let chunkHeight =
    _conversationHeight * Math.floor(count / conversation.length);

  // The remainder of items not in a full conversation in the chunk should
  // be added.
  const extra = count % conversation.length;
  for (let i = 0; i < extra; i++) {
    chunkHeight += getHeight(
      conversation[(startIndex + i) % conversation.length],
    );
  }

  return chunkHeight;
}

const shimmerColor = "hsl(0, 0%, 94%)"; // `Color.grey0` is too light and `Color.grey1` is too dark
const lineBarHeight = Font.size2.fontSize * 0.6;

const styles = StyleSheet.create({
  comment: {
    flexDirection: "row",
    paddingLeft: Space.space3,
    paddingRight: Comment.paddingRight,
  },
  commentWithByline: {
    paddingTop: Comment.paddingTopWithByline,
  },
  commentWithoutByline: {
    paddingTop: Comment.paddingTopWithoutByline,
  },
  spaceLeft: {
    width: AccountAvatarSmall.size,
  },
  avatar: {
    position: "relative",
    top: Font.size2.lineHeight - AccountAvatarSmall.size / 2 - 4,
    width: AccountAvatarSmall.size,
    height: AccountAvatarSmall.size,
    borderRadius: AccountAvatarSmall.size / 2,
    backgroundColor: shimmerColor,
  },
  body: {
    flex: 1,
    paddingLeft: Space.space2,
  },
  byline: {
    width: "20%",
    height: lineBarHeight,
    marginVertical: (Font.size2.lineHeight - lineBarHeight) / 2,
    backgroundColor: shimmerColor,
    borderRadius: Border.radius0,
  },
  line: {
    height: lineBarHeight,
    marginVertical: (Font.size2.lineHeight - lineBarHeight) / 2,
    backgroundColor: shimmerColor,
    borderRadius: Border.radius0,
  },
});
