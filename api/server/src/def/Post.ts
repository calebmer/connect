import {
  APIError,
  APIErrorCode,
  DateTime,
  GroupID,
  Post,
  PostCursor,
  PostID,
  Range,
} from "@connect/api-client";
import {Context} from "../Context";
import {PGPagination} from "../pg/PGPagination";
import {sql} from "../pg/SQL";

/**
 * Get a single post from our database.
 */
export async function getPost(
  ctx: Context,
  input: {readonly id: PostID},
): Promise<{readonly post: Post | null}> {
  const postID = input.id;
  const {
    rows: [row],
  } = await ctx.query(sql`
    SELECT group_id, author_id, published_at, comment_count, content
      FROM post
     WHERE id = ${postID}
  `);
  if (row === undefined) {
    return {post: null};
  } else {
    const post: Post = {
      id: input.id,
      groupID: row.group_id,
      authorID: row.author_id,
      publishedAt: row.published_at,
      commentCount: row.comment_count,
      content: row.content,
    };
    return {post};
  }
}

// Create a paginator for posts.
const PGPaginationPost = new PGPagination(sql`post`, [
  {column: sql`published_at`, descending: true},
  {column: sql`id`, descending: true},
]);

/**
 * Get posts in a group by reverse chronological order.
 */
export async function getGroupPosts(
  ctx: Context,
  input: {readonly groupID: GroupID} & Range<PostCursor>,
): Promise<{
  readonly posts: ReadonlyArray<Post>;
}> {
  // Get a list of posts in reverse chronological order using the pagination
  // parameters provided by our input.
  const {rows} = await PGPaginationPost.query(ctx, {
    selection: sql`id, author_id, published_at, comment_count, content`,
    extraCondition: sql`group_id = ${sql.value(input.groupID)}`,
    range: input,
  });

  const posts = rows.map(
    (row): Post => ({
      id: row.id,
      groupID: input.groupID,
      authorID: row.author_id,
      publishedAt: row.published_at,
      commentCount: row.comment_count,
      content: row.content,
    }),
  );

  return {posts};
}

/**
 * Publishes a new post.
 */
export async function publishPost(
  ctx: Context,
  input: {
    readonly id: PostID;
    readonly groupID: GroupID;
    readonly content: string;
  },
): Promise<{
  readonly publishedAt: DateTime;
}> {
  // Reject post content that is empty or made up only of spaces.
  if (/^\s*$/.test(input.content)) {
    throw new APIError(APIErrorCode.BAD_INPUT);
  }

  // Actually insert the comment...
  const {
    rows: [row],
  } = await ctx.query(sql`
    INSERT INTO post (id, group_id, author_id, content)
         VALUES (${input.id},
                 ${input.groupID},
                 ${ctx.accountID},
                 ${input.content.trim()})
      RETURNING published_at
  `);

  // Follow the post we just published...
  await ctx.query(sql`
    INSERT INTO post_follower (post_id, account_id)
         VALUES (${input.id}, ${ctx.accountID})
  `);

  return {
    publishedAt: row.published_at,
  };
}
