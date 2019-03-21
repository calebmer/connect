import {Group, GroupID, Post, PostCursor, Range} from "@connect/api-client";
import {Context} from "../Context";
import {PGPagination} from "../pg/PGPagination";
import {sql} from "../pg/PGSQL";

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
  } = await ctx.query(
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

// Create a paginator for posts.
const PGPaginationPost = new PGPagination(sql`post`, [
  {column: sql`published_at`, descending: true},
  {column: sql`id`},
]);

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
  const {rows} = await PGPaginationPost.query(ctx, {
    selection: sql`id, author_id, published_at, content`,
    extraCondition: sql`group_id = ${sql.value(input.groupID)}`,
    range: input,
  });

  const posts = rows.map(
    (row): Post => ({
      id: row.id,
      groupID: input.groupID,
      authorID: row.author_id,
      publishedAt: row.published_at,
      content: row.content,
    }),
  );

  return {posts};
}
