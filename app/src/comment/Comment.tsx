import {AccountCache, useCurrentAccount} from "../account/AccountCache";
import {
  AccountProfile,
  CommentID,
  Comment as _Comment,
} from "@connect/api-client";
import {BodyText, Font, Space} from "../atoms";
import {
  Platform,
  ScrollView,
  StyleSheet,
  UIManager,
  View,
  findNodeHandle,
} from "react-native";
import React, {useRef} from "react";
import {AccountAvatarSmall} from "../account/AccountAvatarSmall";
import {AccountByline} from "../account/AccountByline";
import {CommentCache} from "./CommentCache";
import {CommentMeasurements} from "./CommentMeasurements";
import {useCache} from "../cache/Cache";

// NOTE: Having a React component and a type with the same name is ok in
// TypeScript, but eslint complains when it’s an import. So import the type with
// a different name and alias it here.
type Comment = _Comment;

function Comment({
  commentID,
  lastCommentID,
  realtime,
  scrollViewRef,
}: {
  commentID: CommentID;
  lastCommentID: CommentID | null;
  realtime: boolean;
  scrollViewRef: React.RefObject<ScrollView>;
}) {
  // If we were provided an ID for the comment before our own then preload that
  // data since we’ll be using it.
  if (lastCommentID != null) {
    CommentCache.preload(lastCommentID);
  }

  // Load our comment data.
  const {comment} = useCache(CommentCache, commentID);
  const author = useCache(AccountCache, comment.authorID);

  // A ref for our comment’s root view.
  const commentRef = useRef<View>(null);

  // Scroll to the end of our scroll view if this is a realtime comment.
  useScrollToEnd(commentRef, scrollViewRef, author, realtime);

  // If there was no comment before this one then we definitely want to render
  // the comment with a byline. Otherwise we want to do some conditional data
  // loading which is why we have a second component.
  if (lastCommentID == null) {
    return (
      <CommentWithByline
        commentRef={commentRef}
        comment={comment}
        author={author}
      />
    );
  } else {
    return (
      <CommentAfterFirst
        commentRef={commentRef}
        comment={comment}
        author={author}
        lastCommentID={lastCommentID}
      />
    );
  }
}

const CommentMemo = React.memo(Comment);
export {CommentMemo as Comment};

// Used to conditionally suspend on some data.
function CommentAfterFirst({
  commentRef,
  comment,
  author,
  lastCommentID,
}: {
  commentRef: React.RefObject<View>;
  comment: Comment;
  author: AccountProfile;
  lastCommentID: CommentID;
}) {
  const {comment: lastComment} = useCache(CommentCache, lastCommentID);

  // If this comment has the same author as our last comment then don’t add a
  // byline to our comment.
  if (lastComment.authorID === comment.authorID) {
    return <CommentWithoutByline commentRef={commentRef} comment={comment} />;
  } else {
    return (
      <CommentWithByline
        commentRef={commentRef}
        comment={comment}
        author={author}
      />
    );
  }
}

/**
 * A comment with a byline. This is the first comment by the same author in a
 * sequence of comments by that author.
 */
function CommentWithByline({
  commentRef,
  comment,
  author,
}: {
  commentRef: React.RefObject<View>;
  comment: Comment;
  author: AccountProfile;
}) {
  return (
    <View ref={commentRef} style={styles.comment}>
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
function CommentWithoutByline({
  commentRef,
  comment,
}: {
  commentRef: React.RefObject<View>;
  comment: Comment;
}) {
  return (
    <View ref={commentRef} style={styles.commentWithoutByline}>
      <BodyText selectable>{comment.content}</BodyText>
    </View>
  );
}

/**
 * Scrolls to the end of our scroll view when the comment mounts since
 * presumably a new mounted component will be at the end of the scroll view.
 */
function useScrollToEnd(
  commentRef: React.RefObject<View>,
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

    if (
      // Was this comment added to the list as a part of a realtime event?
      // Either it came from the server or it was added when the user sent
      // a message.
      realtime === true &&
      // We only want to scroll the view once in our comment’s life cycle. If
      // we’ve scrolled before then don’t scroll again.
      scrolled.current === false
    ) {
      // We only allow scrolling once per component.
      scrolled.current = true;

      // Always scroll if this comment was authored by our current user.
      if (authorAccount.id === currentAccount.id) {
        scrollToEnd();
      } else {
        // If the comment was not authored by our current user then test to see
        // if the comment is near the end of the scroll view. If it is then
        // scroll to end!
        Promise.all([
          // Measure the scroll view’s height...
          new Promise<number>(resolve => {
            UIManager.measure(
              scrollViewRef.current!.getScrollableNode()!,
              (_x, _y, _width, height) => resolve(height),
            );
          }),
          // Measure the comment’s offset in the scroll view...
          new Promise<number>((resolve, reject) => {
            UIManager.measureLayout(
              findNodeHandle(commentRef.current!)!,
              scrollViewRef.current!.getScrollableNode()!,
              () => reject(new Error("Failed to measure relative layout.")),
              (_left, top, _width, height) => resolve(top + height / 2),
            );
          }),
        ])
          .then(([scrollViewHeight, commentOffset]) => {
            // If this comment is close to the end of the scroll view then
            // scroll it into view.
            if (Math.abs(scrollViewHeight - commentOffset) <= Space.space6) {
              scrollToEnd();
            }
          })
          .catch(() => {
            // Ignore any errors...
          });
      }
    }

    function scrollToEnd() {
      // We assume the new comment was added to the end of our scroll view. To
      // avoid flashes we immediately call `scrollToEnd()` instead of attempting
      // to measure out comment which would technically be more correct.
      if (scrollViewRef.current !== null) {
        scrollViewRef.current.scrollToEnd({animated: false});
      }
    }
  }, [
    authorAccount.id,
    commentRef,
    currentAccount.id,
    realtime,
    scrollViewRef,
  ]);
}

const styles = StyleSheet.create({
  comment: {
    flexDirection: "row",
    paddingTop: CommentMeasurements.paddingTopWithByline,
    paddingHorizontal: Space.space3,
  },
  commentAvatar: {
    position: "relative",
    top: Font.size2.lineHeight - AccountAvatarSmall.size / 2 - 4,
  },
  commentWithByline: {
    flex: 1,
    paddingLeft: Space.space2,
    paddingRight: CommentMeasurements.paddingRight,
  },
  commentWithoutByline: {
    paddingTop: CommentMeasurements.paddingTopWithoutByline,
    paddingLeft: CommentMeasurements.paddingLeft,
    paddingRight: CommentMeasurements.paddingRight,
  },
});
