import {AccountCache, useCurrentAccount} from "../account/AccountCache";
import {
  AccountProfile,
  CommentID,
  Comment as _Comment,
} from "@connect/api-client";
import {BodyText, Font, Space} from "../atoms";
import {Platform, ScrollView, StyleSheet, View} from "react-native";
import React, {useRef} from "react";
import {AccountAvatarSmall} from "../account/AccountAvatarSmall";
import {AccountByline} from "../account/AccountByline";
import {CommentCache} from "./CommentCache";
import {useCache} from "../cache/Cache";

// NOTE: Having a React component and a type with the same name is ok in
// TypeScript, but eslint complains when it’s an import. So import the type with
// a different name and alias it here.
type Comment = _Comment;

function Comment({
  commentID,
  lastCommentID,
  realtime,
}: {
  commentID: CommentID;
  lastCommentID: CommentID | null;
  realtime: boolean;
  // scrollViewRef: React.RefObject<ScrollView>;
}) {
  // If we were provided an ID for the comment before our own then preload that
  // data since we’ll be using it.
  if (lastCommentID != null) {
    CommentCache.preload(lastCommentID);
  }

  // Load our comment data.
  const {comment} = useCache(CommentCache, commentID);
  const author = useCache(AccountCache, comment.authorID);

  // TODO:
  // // Scroll to the end of our scroll view if this is a realtime comment.
  // useScrollToEnd(scrollViewRef, author, realtime);

  // If there was no comment before this one then we definitely want to render
  // the comment with a byline. Otherwise we want to do some conditional data
  // loading which is why we have a second component.
  if (lastCommentID == null) {
    return <CommentWithByline comment={comment} author={author} />;
  } else {
    return (
      <CommentAfterFirst
        comment={comment}
        author={author}
        lastCommentID={lastCommentID}
      />
    );
  }
}

Comment.paddingLeft = Space.space3 + AccountAvatarSmall.size + Space.space2;
Comment.paddingRight = Space.space4;
Comment.paddingTopWithByline = Space.space3;
Comment.paddingTopWithoutByline = Font.size2.lineHeight / 3;

const CommentMemo = Object.assign(React.memo(Comment), {
  paddingLeft: Comment.paddingLeft,
  paddingRight: Comment.paddingRight,
  paddingTopWithByline: Comment.paddingTopWithByline,
  paddingTopWithoutByline: Comment.paddingTopWithoutByline,
});

export {CommentMemo as Comment};

// Used to conditionally suspend on some data.
function CommentAfterFirst({
  comment,
  author,
  lastCommentID,
}: {
  comment: Comment;
  author: AccountProfile;
  lastCommentID: CommentID;
}) {
  const {comment: lastComment} = useCache(CommentCache, lastCommentID);

  // If this comment has the same author as our last comment then don’t add a
  // byline to our comment.
  if (lastComment.authorID === comment.authorID) {
    return <CommentWithoutByline comment={comment} />;
  } else {
    return <CommentWithByline comment={comment} author={author} />;
  }
}

/**
 * A comment with a byline. This is the first comment by the same author in a
 * sequence of comments by that author.
 */
function CommentWithByline({
  comment,
  author,
}: {
  comment: Comment;
  author: AccountProfile;
}) {
  return (
    <View style={styles.comment}>
      <AccountAvatarSmall style={styles.commentAvatar} account={author} />
      <View style={styles.commentWithByline}>
        <AccountByline account={author} publishedAt={comment.publishedAt} />
        <BodyText selectable>{comment.content}</BodyText>
      </View>
    </View>
  );
}

/**
 * A comment without a byline. This is one of the comments after the first in
 * a sequence of comments by the same author.
 */
function CommentWithoutByline({comment}: {comment: Comment}) {
  return (
    <View style={styles.commentWithoutByline}>
      <BodyText selectable>{comment.content}</BodyText>
    </View>
  );
}

/**
 * Scrolls to the end of our scroll view when the comment mounts since
 * presumably a new mounted component will be at the end of the scroll view.
 */
function useScrollToEnd(
  scrollViewRef: React.RefObject<ScrollView>,
  authorAccount: AccountProfile,
  realtime: boolean,
) {
  const scrolled = useRef(false);
  const currentAccount = useCurrentAccount();

  // Use a layout effect so that the browser doesn’t get a chance to finish
  // painting before we scroll.
  const useEffect =
    Platform.OS === "web" ? React.useLayoutEffect : React.useEffect;

  useEffect(() => {
    // If we don’t have a scroll view ref then don’t run our effect. If the
    // scroll view is mounting at the same time as our comment is running its
    // layout effect on web, then we won’t have a scroll view ref!
    if (scrollViewRef.current === null) {
      return;
    }

    // Should we scroll to this comment?
    const shouldScroll =
      // Was this comment added to the list as a part of a realtime event?
      // Either it came from the server or it was added when the user sent
      // a message.
      realtime &&
      // We only want to scroll the view once in our comment’s life cycle. If
      // we’ve scrolled before then don’t scroll again.
      !scrolled.current &&
      // Always scroll if this comment was authored by our current user.
      authorAccount.id === currentAccount.id;

    if (shouldScroll) {
      // We only allow scrolling once per component.
      scrolled.current = true;

      // We assume the new comment was added to the end of our scroll view. To
      // avoid flashes we immediately call `scrollToEnd()` instead of attempting
      // to measure out comment which would technically be more correct.
      scrollViewRef.current.scrollToEnd({animated: false});
    }
  }, [authorAccount.id, currentAccount.id, realtime, scrollViewRef]);
}

const styles = StyleSheet.create({
  comment: {
    flexDirection: "row",
    paddingTop: Comment.paddingTopWithByline,
    paddingHorizontal: Space.space3,
  },
  commentAvatar: {
    position: "relative",
    top: Font.size2.lineHeight - AccountAvatarSmall.size / 2 - 4,
  },
  commentWithByline: {
    flex: 1,
    paddingLeft: Space.space2,
    paddingRight: Comment.paddingRight,
  },
  commentWithoutByline: {
    paddingTop: Comment.paddingTopWithoutByline,
    paddingLeft: Comment.paddingLeft,
    paddingRight: Comment.paddingRight,
  },
});
