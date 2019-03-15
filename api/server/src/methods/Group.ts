import {
  APIError,
  APIErrorCode,
  AccountID,
  DateTime,
  Group,
  GroupID,
} from "@connect/api-client";
import {GroupCollection} from "../entities/Group";
import {Post} from "@connect/api-client";

/**
 * Gets a group by its slug, but only if the authenticated account is a member
 * of that group.
 */
export async function getBySlug(
  ctx: {readonly groups: GroupCollection},
  accountID: AccountID,
  {slug}: {readonly slug: string},
): Promise<{readonly group: Group}> {
  // First get this account’s membership in the group. If the account does not
  // have a membership then pretend that the group does not exist by
  // returning null.
  const membership = await ctx.groups.getMembershipWithSlug(accountID, slug);
  if (!membership) throw new APIError(APIErrorCode.NOT_FOUND);

  // We can safely get the group data now!
  const group = await ctx.groups.get(membership);
  return {group};
}

/**
 * Get posts in a group by reverse chronological order.
 */
export async function getPosts(
  ctx: {readonly groups: GroupCollection},
  accountID: AccountID,
  input: {
    readonly id: GroupID;
    readonly after: DateTime | null;
    readonly first: number;
  },
): Promise<{
  readonly posts: ReadonlyArray<Post>;
}> {
  // Confirm that this account is a member of the group.
  const membership = await ctx.groups.getMembership(accountID, input.id);
  if (!membership) throw new APIError(APIErrorCode.NOT_FOUND);

  // Get a list of posts in reverse chronological order using the pagination
  // provided by our input.
  const posts = await ctx.groups.getPosts(membership, input);

  return {posts};
}
