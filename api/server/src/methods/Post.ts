import {
  APIError,
  APIErrorCode,
  AccountID,
  Comment,
  Post,
  PostID,
} from "@connect/api-client";
import {PostCollection} from "../entities/Post";

export async function get(
  ctx: {readonly posts: PostCollection},
  accountID: AccountID,
  input: {readonly id: PostID},
): Promise<{readonly post: Post}> {
  const post = await ctx.posts.get(accountID, input.id);
  if (post == null) throw new APIError(APIErrorCode.NOT_FOUND);
  return {post};
}

export async function getComments(): Promise<{
  readonly comments: ReadonlyArray<Comment>;
}> {
  throw new Error("TODO");
}
