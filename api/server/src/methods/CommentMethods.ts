import {
  APIError,
  APIErrorCode,
  Comment,
  CommentCursor,
  CommentID,
  DateTime,
  PostID,
  Range,
} from "@connect/api-client";
import {Context} from "../Context";
import {PGPagination} from "../PGPagination";
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

// Create a paginator for comments.
const PGPaginationComment = new PGPagination(sql`comment`, [
  {column: sql`published_at`},
  {column: sql`id`},
]);

/**
 * Get the comments for a post.
 */
export async function getPostComments(
  ctx: Context,
  input: {readonly postID: PostID} & Range<CommentCursor>,
): Promise<{
  readonly comments: ReadonlyArray<Comment>;
}> {
  // Get a list of comments in chronological order using the pagination
  // parameters provided by our input.
  const {rows} = await PGPaginationComment.query(ctx, {
    selection: sql`id, author_id, published_at, content`,
    extraCondition: sql`post_id = ${sql.value(input.postID)}`,
    range: input,
  });

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
                 ${input.content})
      RETURNING published_at
  `);

  return {
    publishedAt: row.published_at,
  };
}
