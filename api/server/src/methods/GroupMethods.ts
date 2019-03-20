import {
  AccountID,
  Group,
  GroupID,
  Post,
  PostCursor,
  Range,
} from "@connect/api-client";
import {GroupTable} from "../tables/GroupTable";
import {PGClient} from "../pg/PGClient";
import {PGPagination} from "../pg/PGPagination";
import {PostTable} from "../tables/PostTable";

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
  ctx: {readonly client: PGClient},
  accountID: AccountID,
  input: {readonly slug: string},
): Promise<{readonly group: Group}> {
  // Select the group which has a slug equal to our provided slug. Slugs have
  // a unique index in our database which allows for efficient selection.
  const [group] = await GroupTable.select({
    id: GroupTable.id,
    slug: GroupTable.slug,
    name: GroupTable.name,
  })
    .where(GroupTable.slug.equals(input.slug))
    .execute(ctx.client, accountID);

  return {group: group || null};
}

/**
 * Get posts in a group by reverse chronological order.
 */
export async function getPosts(
  ctx: {readonly client: PGClient},
  accountID: AccountID,
  input: {readonly groupID: GroupID} & Range<PostCursor>,
): Promise<{
  readonly posts: ReadonlyArray<Post>;
}> {
  // Get a list of posts in reverse chronological order using the pagination
  // parameters provided by our input.
  const posts = await PostTablePagination.query(
    ctx.client,
    accountID,
    input,
    PostTable.select({
      id: PostTable.id,
      groupID: PostTable.group_id,
      authorID: PostTable.author_id,
      publishedAt: PostTable.published_at,
      content: PostTable.content,
    }).where(PostTable.group_id.equals(input.groupID)),
  );

  return {posts};
}
