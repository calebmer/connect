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

const _CommentShimmer = React.memo(CommentShimmer);
export {_CommentShimmer as CommentShimmer};

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
