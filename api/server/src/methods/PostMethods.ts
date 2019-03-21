import {Comment, Post, PostID} from "@connect/api-client";
import {Context} from "../Context";
import {PostTable} from "../tables/PostTable";

/**
 * Get a single post from our database.
 */
export async function get(
  ctx: Context,
  input: {readonly id: PostID},
): Promise<{readonly post: Post}> {
  // Select a post from our post’s table.
  const [post] = await PostTable.select({
    id: PostTable.id,
    groupID: PostTable.group_id,
    authorID: PostTable.author_id,
    publishedAt: PostTable.published_at,
    content: PostTable.content,
  })
    .where(PostTable.id.equals(input.id))
    .execute(ctx);

  return {post: post || null};
}

/**
 * Get the comments for a post.
 */
export async function getComments(): Promise<{
  readonly comments: ReadonlyArray<Comment>;
}> {
  throw new Error("TODO");
}
