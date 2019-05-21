import {Border, Font, Space} from "../atoms";
import React, {ReactElement} from "react";
import {AccountAvatarSmall} from "../account/AccountAvatarSmall";
import {Comment} from "./Comment";
import {StyleSheet} from "react-native";
import {createDivElement} from "../utils/forks/createDivElement";

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
 *
 * It’s important that we keep shimmer’s small. We don’t really want one more
 * than two lines long. That’s because if the shimmers are larger than the real
 * conversation, we’ll have loaded too few items to fit into the current screen.
 */
const conversation: ReadonlyArray<CommentShimmer> = [
  {byline: true, lines: [84]},
  {byline: true, lines: [12]},
  {byline: false, lines: [37]},
  {byline: true, lines: [100, 57]},
  {byline: false, lines: [100, 12]},
  {byline: true, lines: [100, 88]},
  {byline: false, lines: [37]},
  {byline: true, lines: [92, 100]},
  {byline: false, lines: [65]},
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
    _conversationNodes = conversation.map(comment =>
      createDivElement(
        {
          style: [
            styles.comment,
            comment.byline
              ? styles.commentWithByline
              : styles.commentWithoutByline,
            {height: getCommentHeight(comment)},
          ],
        },
        comment.byline && createDivElement({style: styles.avatar}),
        createDivElement(
          {style: styles.body},
          comment.byline && createDivElement({style: styles.byline}),
          comment.lines.map((line, index) =>
            createDivElement({
              key: String(index),
              style: [styles.line, {width: `${line}%`}],
            }),
          ),
        ),
      ),
    );
  }
  return _conversationNodes;
}

function CommentShimmer({index}: {index: number}) {
  const conversationNodes = getConversationNodes();
  return conversationNodes[index % conversationNodes.length];
}

const _CommentShimmer = Object.assign(React.memo(CommentShimmer), {
  getHeight,
  getIndex,
});

export {_CommentShimmer as CommentShimmer};

/**
 * Gets the height of a single comment shimmer.
 */
function getCommentHeight(comment: CommentShimmer): number {
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
 * Gets the height of a full content shimmer conversation.
 */
function getConversationHeight(): number {
  // Compute the height of a full conversation if we haven’t already.
  if (_conversationHeight === undefined) {
    _conversationHeight = conversation.reduce(
      (height, comment) => height + getCommentHeight(comment),
      0,
    );
  }
  return _conversationHeight;
}

/**
 * Gets the height of a chunk of content shimmers. The chunk has a size of
 * `count`. If the chunk starts on a shimmer other than the shimmer at index 0
 * then we use that.
 */
function getHeight(count: number, startIndex: number = 0): number {
  if (count === 0) return 0;

  // Start with a height based on the number of shimmer conversations in
  // our chunk
  let height =
    getConversationHeight() * Math.floor(count / conversation.length);

  // The remainder of items not in a full conversation in the chunk should
  // be added.
  const extra = count % conversation.length;
  for (let i = 0; i < extra; i++) {
    height += getCommentHeight(
      conversation[(startIndex + i) % conversation.length],
    );
  }

  return height;
}

/**
 * Gets the index of a comment based on an offset in height measurement units.
 * By default we assume the index the offset is from is 0 but it is configurable
 * with the second parameter.
 */
function getIndex(offset: number, startIndex: number = 0): number {
  // Get the starting index based on how many conversations are in the offset.
  let index =
    Math.floor(offset / getConversationHeight()) * conversation.length;

  // Find out the number of remaining items outside of a full chunk.
  let extra = offset % getConversationHeight();
  for (let i = 0; extra > 0; i++) {
    extra -= getCommentHeight(
      conversation[(startIndex + i) % conversation.length],
    );
    index += 1;
  }

  return index;
}

const shimmerColor = "hsl(0, 0%, 94%)"; // `Color.grey0` is too light and `Color.grey1` is too dark
const lineBarHeight = Font.size2.fontSize * 0.6;

const styles = StyleSheet.create({
  comment: {
    position: "relative",
    paddingLeft: Space.space3,
    paddingRight: Comment.paddingRight,
  },
  commentWithByline: {
    paddingTop: Comment.paddingTopWithByline,
  },
  commentWithoutByline: {
    paddingTop: Comment.paddingTopWithoutByline,
  },
  avatar: {
    position: "absolute",
    top:
      Comment.paddingTopWithByline +
      (Font.size2.lineHeight - AccountAvatarSmall.size / 2 - 4),
    left: Space.space3,
    width: AccountAvatarSmall.size,
    height: AccountAvatarSmall.size,
    borderRadius: AccountAvatarSmall.size / 2,
    backgroundColor: shimmerColor,
  },
  body: {
    marginLeft: AccountAvatarSmall.size + Space.space2,
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
