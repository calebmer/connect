import {Group, GroupID, Post, PostCursor, Range} from "@connect/api-client";
import {Context} from "../Context";
import {PGPagination} from "../pg/PGPagination";
import {PostTable} from "../tables/PostTable";
import {sql} from "../pg/PGSQL";

// Create a paginator for posts.
const PostTablePagination = new PGPagination([
  {column: PostTable.published_at, descending: true},
  {column: PostTable.id},
]);

/**
 * Gets a group by its slug, but only if the authenticated account is a member
 * of that group.
 */
export async function getBySlug(
  ctx: Context,
  input: {readonly slug: string},
): Promise<{readonly group: Group | null}> {
  const {
    rows: [row],
  } = await ctx.client.query(
    sql`SELECT id, name FROM "group" WHERE slug = ${input.slug}`,
  );

  if (row === undefined) {
    return {group: null};
  } else {
    return {
      group: {
        id: row.id,
        slug: input.slug,
        name: row.name,
      },
    };
  }
}

/**
 * Get posts in a group by reverse chronological order.
 */
export async function getPosts(
  ctx: Context,
  input: {readonly groupID: GroupID} & Range<PostCursor>,
): Promise<{
  readonly posts: ReadonlyArray<Post>;
}> {
  // Get a list of posts in reverse chronological order using the pagination
  // parameters provided by our input.
  const posts = await PostTablePagination.query(
    ctx,
    PostTable.select({
      id: PostTable.id,
      groupID: PostTable.group_id,
      authorID: PostTable.author_id,
      publishedAt: PostTable.published_at,
      content: PostTable.content,
    }).where(PostTable.group_id.equals(input.groupID)),
    input,
  );

  return {posts};
}
