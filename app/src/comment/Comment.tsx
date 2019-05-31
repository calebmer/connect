import {
  AccountProfile,
  CommentID,
  Comment as _Comment,
} from "@connect/api-client";
import {BodyText, Color, Font, Icon, Space} from "../atoms";
import {CommentCache, CommentCacheEntryStatus} from "./CommentCache";
import React, {useEffect, useRef, useState} from "react";
import {ScrollView, StyleProp, StyleSheet, View, ViewStyle} from "react-native";
import {AccountAvatarSmall} from "../account/AccountAvatarSmall";
import {AccountByline} from "../account/AccountByline";
import {AccountCache} from "../account/AccountCache";
import {CommentMeasurements} from "./CommentMeasurements";
import {useCache} from "../cache/Cache";

// NOTE: Having a React component and a type with the same name is ok in
// TypeScript, but eslint complains when it’s an import. So import the type with
// a different name and alias it here.
type Comment = _Comment;

function Comment({
  commentID,
  lastCommentID,
}: {
  commentID: CommentID;
  lastCommentID: CommentID | null;
  scrollViewRef: React.RefObject<ScrollView>;
}) {
  // If we were provided an ID for the comment before our own then preload that
  // data since we’ll be using it.
  if (lastCommentID != null) {
    CommentCache.preload(lastCommentID);
  }

  // Load our comment data.
  const {status, comment} = useCache(CommentCache, commentID);
  const author = useCache(AccountCache, comment.authorID);

  // A ref for our comment’s root view.
  const commentRef = useRef<View>(null);

  // Our optimistic status. We render our comment as commit even if it is
  // actually pending. If it takes our comment a while to commit then we reflect
  // the comment as pending in the UI.
  const [optimisticStatus, setOptimisticStatus] = useState(
    status === CommentCacheEntryStatus.Pending
      ? CommentCacheEntryStatus.Commit
      : status,
  );

  // If we have a “pending” status then we want to optimistically render our
  // comment as if it is fully commit. After some time if our comment is still
  // pending we’ll reflect that in the UI.
  useEffect(() => {
    if (status === CommentCacheEntryStatus.Pending) {
      setOptimisticStatus(CommentCacheEntryStatus.Commit);
      const timeoutID = setTimeout(() => {
        setOptimisticStatus(CommentCacheEntryStatus.Pending);
      }, 200);
      return () => clearTimeout(timeoutID);
    } else {
      setOptimisticStatus(status);
      return;
    }
  }, [status]);

  // If there was no comment before this one then we definitely want to render
  // the comment with a byline. Otherwise we want to do some conditional data
  // loading which is why we have a second component.
  if (lastCommentID == null) {
    return (
      <CommentWithByline
        commentRef={commentRef}
        comment={comment}
        author={author}
        status={optimisticStatus}
      />
    );
  } else {
    return (
      <CommentAfterFirst
        commentRef={commentRef}
        comment={comment}
        author={author}
        lastCommentID={lastCommentID}
        status={optimisticStatus}
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
  status,
}: {
  commentRef: React.RefObject<View>;
  comment: Comment;
  author: AccountProfile;
  lastCommentID: CommentID;
  status: CommentCacheEntryStatus;
}) {
  const {comment: lastComment} = useCache(CommentCache, lastCommentID);

  // If this comment has the same author as our last comment then don’t add a
  // byline to our comment.
  if (lastComment.authorID === comment.authorID) {
    return (
      <CommentWithoutByline
        commentRef={commentRef}
        comment={comment}
        status={status}
      />
    );
  } else {
    return (
      <CommentWithByline
        commentRef={commentRef}
        comment={comment}
        author={author}
        status={status}
      />
    );
  }
}

/**
 * Shared view container for our comments.
 */
function CommentView({
  style,
  commentRef,
  status,
  children,
}: {
  style: StyleProp<ViewStyle>;
  commentRef: React.RefObject<View>;
  status: CommentCacheEntryStatus;
  children: React.Node;
}) {
  return (
    <View
      ref={commentRef}
      style={[
        styles.comment,
        status === CommentCacheEntryStatus.Pending && styles.commentPending,
        status === CommentCacheEntryStatus.Rollback && styles.commentRollback,
        style,
      ]}
    >
      {status === CommentCacheEntryStatus.Rollback && (
        <Icon style={styles.commentRollbackIcon} name="x" color={Color.red4} />
      )}
      {children}
    </View>
  );
}

/**
 * A comment with a byline. This is the first comment by the same author in a
 * sequence of comments by that author.
 */
function CommentWithByline({
  commentRef,
  comment,
  author,
  status,
}: {
  commentRef: React.RefObject<View>;
  comment: Comment;
  author: AccountProfile;
  status: CommentCacheEntryStatus;
}) {
  return (
    <CommentView
      style={styles.commentWithByline}
      commentRef={commentRef}
      status={status}
    >
      <AccountAvatarSmall style={styles.commentAvatar} account={author} />
      <View style={styles.commentWithBylineBody}>
        <AccountByline account={author} publishedAt={comment.publishedAt} />
        <BodyText selectable>{comment.content}</BodyText>
      </View>
    </CommentView>
  );
}

/**
 * A comment without a byline. This is one of the comments after the first in
 * a sequence of comments by the same author.
 */
function CommentWithoutByline({
  commentRef,
  comment,
  status,
}: {
  commentRef: React.RefObject<View>;
  comment: Comment;
  status: CommentCacheEntryStatus;
}) {
  return (
    <CommentView
      style={styles.commentWithoutByline}
      commentRef={commentRef}
      status={status}
    >
      <BodyText selectable>{comment.content}</BodyText>
    </CommentView>
  );
}

const paddingVertical = Space.space0;

const styles = StyleSheet.create({
  comment: {
    paddingVertical: paddingVertical,
    paddingLeft: Space.space3,
    paddingRight: CommentMeasurements.paddingRight,
    marginBottom: -paddingVertical,
    backgroundColor: Color.white,
    borderRightColor: Color.white,
  },
  commentPending: {
    opacity: 0.3,
  },
  commentRollback: {
    backgroundColor: Color.red0,
  },
  commentRollbackIcon: {
    position: "absolute",
    top: (Font.size2.lineHeight - Space.space3) / 2,
    right: (Font.size2.lineHeight - Space.space3) / 2,
  },
  commentWithByline: {
    flexDirection: "row",
    marginTop: CommentMeasurements.paddingTopWithByline - paddingVertical,
  },
  commentWithBylineBody: {
    flex: 1,
    paddingLeft: Space.space2,
  },
  commentAvatar: {
    position: "relative",
    top: Font.size2.lineHeight - AccountAvatarSmall.size / 2 - 4,
  },
  commentWithoutByline: {
    marginTop: CommentMeasurements.paddingTopWithoutByline - paddingVertical,
    paddingLeft: CommentMeasurements.paddingLeft,
  },
});
