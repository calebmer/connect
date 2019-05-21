import {
  APIError,
  APIErrorCode,
  Comment,
  CommentID,
  DateTime,
  PostCommentEvent,
  PostID,
} from "@connect/api-client";
import {Context, ContextSubscription} from "../Context";
import {PGListen, PGListenChannel} from "../pg/PGListen";
import {sql} from "../pg/SQL";

/**
 * Get a single comment from our database.
 */
export async function getComment(
  ctx: Context,
  input: {readonly id: CommentID},
): Promise<{
  readonly comment: Comment | null;
}> {
  const commentID = input.id;
  const {
    rows: [row],
  } = await ctx.query(sql`
    SELECT post_id, author_id, published_at, content
      FROM comment
     WHERE id = ${commentID}
  `);
  if (row === undefined) {
    return {comment: null};
  } else {
    const comment: Comment = {
      id: input.id,
      postID: row.post_id,
      authorID: row.author_id,
      publishedAt: row.published_at,
      content: row.content,
    };
    return {comment};
  }
}

/**
 * Get the comments for a post. We use limit/offset based pagination instead of
 * cursor based pagination unlike many of our other lists.
 *
 * NOTE: As a default, always use cursor pagination! Limit/offset pagination
 * only makes sense here because of the UI we are using. See `getGroupPosts`
 * as an example of cursor pagination.
 */
export async function getPostComments(
  ctx: Context,
  input: {
    readonly postID: PostID;
    readonly limit: number;
    readonly offset: number;
  },
): Promise<{
  readonly comments: ReadonlyArray<Comment>;
}> {
  // Get a list of comments in chronological order using the pagination
  // parameters provided by our input.
  const {rows} = await ctx.query(sql`
      SELECT id, author_id, published_at, content
        FROM comment
       WHERE post_id = ${input.postID}
    ORDER BY published_at, id
       LIMIT ${input.limit}
      OFFSET ${input.offset}
  `);

  const comments = rows.map(
    (row): Comment => ({
      id: row.id,
      postID: input.postID,
      authorID: row.author_id,
      publishedAt: row.published_at,
      content: row.content,
    }),
  );

  return {comments};
}

/**
 * Publishes a new comment.
 */
export async function publishComment(
  ctx: Context,
  input: {
    readonly id: CommentID;
    readonly postID: PostID;
    readonly content: string;
  },
): Promise<{
  readonly publishedAt: DateTime;
}> {
  // Reject comment content that is empty or made up only of spaces.
  if (/^\s*$/.test(input.content)) {
    throw new APIError(APIErrorCode.BAD_INPUT);
  }

  // Actually insert the comment...
  const {
    rows: [row],
  } = await ctx.query(sql`
    INSERT INTO comment (id, post_id, author_id, content)
         VALUES (${input.id},
                 ${input.postID},
                 ${ctx.accountID},
                 ${input.content.trim()})
      RETURNING published_at
  `);

  // Notify anyone listening that a comment was just inserted! Send the post and
  // comment ID so that listeners can determine if they are interested or not.
  //
  // We only send the notification after the transaction commits so that
  // listeners are able to see the comment we inserted.
  //
  // We manually notify in our API method instead of using a Postgres trigger
  // in case we want to swap out Postgres for dedicated pub/sub infrastructure.
  ctx.afterCommit(async () => {
    await PGListen.notify(CommentInsertChannel, {
      postID: input.postID,
      commentID: input.id,
    });
  });

  return {
    publishedAt: row.published_at,
  };
}

// The Postgres channel we use for notifying when a comment was inserted.
const CommentInsertChannel = PGListenChannel.create<{
  postID: PostID;
  commentID: CommentID;
}>("comment_insert");

// All the subscribers for various posts in our application.
const subscribers = new Map<
  PostID,
  Set<ContextSubscription<PostCommentEvent>>
>();

// If we are listening to the database for comment insertions then this will be
// set to a function which we can call to stop listening to the database.
let unlistenCommentInsert: Promise<() => Promise<void>> | undefined;

/**
 * Subscribes to new comments for the provided post.
 */
export async function watchPostComments(
  ctx: ContextSubscription<PostCommentEvent>,
  input: {postID: PostID},
): Promise<() => Promise<void>> {
  // If we haven’t yet listened to our Postgres channel then do that now.
  //
  // We do this before everything else since in case this function fails we
  // don’t want to put ourselves into a bad state.
  //
  // It’s important that we synchronously set `unlistenCommentInsert` so that
  // if this function is called twice in parallel we don’t end up
  // listening twice.
  if (unlistenCommentInsert === undefined) {
    if (subscribers.size !== 0) {
      throw new Error("Expected subscribers to be empty.");
    }
    unlistenCommentInsert = PGListen.listen(
      CommentInsertChannel,
      handleCommentInsertAll,
    );
    await unlistenCommentInsert;
  }

  // Check to make sure that the subscriber is allowed to see the post we will
  // be listening to. Get the comment count from that post and send it to
  // our client.
  //
  // We must try to get the comment count _after_ we’ve successfully listened
  // so that we don’t miss any comments.
  //
  // If we fail then we need to unsubscribe.
  try {
    const {
      rows: [row],
    } = await ctx.query(
      sql`SELECT comment_count FROM post WHERE id = ${input.postID}`,
    );
    if (row === undefined) {
      throw new APIError(APIErrorCode.UNAUTHORIZED);
    }
    ctx.publish({
      type: "count",
      commentCount: row.comment_count,
    });
  } catch (error) {
    await unsubscribe();
    throw error;
  }

  // Get the subscribers for the provided post ID. If there are no subscribers
  // then create a new set.
  let postSubscribers = subscribers.get(input.postID);
  if (postSubscribers === undefined) {
    postSubscribers = new Set();
    subscribers.set(input.postID, postSubscribers);
  }

  // Add our subscription to the set.
  postSubscribers.add(ctx);

  return unsubscribe;

  async function unsubscribe() {
    // Delete the subscriber from our map when unsubscribing from a
    // post’s comments.
    const postSubscribers = subscribers.get(input.postID);
    if (postSubscribers !== undefined) {
      postSubscribers.delete(ctx);
      if (postSubscribers.size === 0) {
        subscribers.delete(input.postID);
      }
    }

    // If we have no more subscribers, then stop listening to the database for
    // comment insertions.
    if (subscribers.size === 0 && unlistenCommentInsert !== undefined) {
      const actualUnlistenCommentInsert = await unlistenCommentInsert;
      unlistenCommentInsert = undefined;
      await actualUnlistenCommentInsert();
    }
  }
}

/**
 * Handles a Postgres database notification for a comment insertion for all
 * subscribers to that comment.
 */
async function handleCommentInsertAll(payload: {
  postID: PostID;
  commentID: CommentID;
}) {
  const postSubscribers = subscribers.get(payload.postID);
  if (postSubscribers === undefined) return;
  if (postSubscribers.size === 0) return;

  const promises: Array<Promise<void>> = [];

  postSubscribers.forEach(ctx => {
    promises.push(handleCommentInsert(ctx, payload.postID, payload.commentID));
  });

  await Promise.all(promises);
}

/**
 * Handle a comment insertion notification for a single user.
 */
async function handleCommentInsert(
  ctx: ContextSubscription<PostCommentEvent>,
  postID: PostID,
  commentID: CommentID,
) {
  // Fetch the comment from the database as our subscription user with
  // their account.
  const comment = await ctx.withAuthorized(async ctx => {
    const {
      rows: [row],
    } = await ctx.query(sql`
      SELECT author_id, published_at, content
        FROM comment
       WHERE id = ${commentID}
    `);
    if (row === undefined) {
      return undefined;
    }
    const comment: Comment = {
      id: commentID,
      postID: postID,
      authorID: row.author_id,
      publishedAt: row.published_at,
      content: row.content,
    };
    return comment;
  });

  // Actually publish the comment!
  if (comment !== undefined) {
    ctx.publish({type: "new", comment});
  }
}
