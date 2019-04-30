import {
  APIError,
  APIErrorCode,
  Comment,
  CommentID,
  DateTime,
  PostID,
} from "@connect/api-client";
import {Context} from "../Context";
import {sql} from "../PGSQL";

/**
 * Get a single comment from our database.
 */
export async function getComment(
  ctx: Context,
  input: {readonly id: CommentID},
): Promise<{readonly comment: Comment | null}> {
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

  return {
    publishedAt: row.published_at,
  };
}
