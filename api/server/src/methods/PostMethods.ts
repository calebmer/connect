import {Comment, Post, PostID} from "@connect/api-client";
import {Context} from "../Context";
import {sql} from "../PGSQL";

/**
 * Get a single post from our database.
 */
export async function get(
  ctx: Context,
  input: {readonly id: PostID},
): Promise<{readonly post: Post | null}> {
  const {
    rows: [row],
  } = await ctx.query(
    sql`SELECT group_id, author_id, published_at, content WHERE id = ${
      input.id
    }`,
  );
  if (row === undefined) {
    return {post: null};
  } else {
    const post: Post = {
      id: input.id,
      groupID: row.group_id,
      authorID: row.author_id,
      publishedAt: row.published_at,
      content: row.content,
    };
    return {post};
  }
}

/**
 * Get the comments for a post.
 */
export async function getComments(): Promise<{
  readonly comments: ReadonlyArray<Comment>;
}> {
  throw new Error("TODO");
}
