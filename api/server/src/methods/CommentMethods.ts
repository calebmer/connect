import {Comment, CommentID} from "@connect/api-client";
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
  } = await ctx.query(
    sql`SELECT post_id, author_id, published_at, content FROM comment WHERE id = ${commentID}`,
  );
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
