import {
  APIError,
  APIErrorCode,
  AccountID,
  AccountProfile,
  Group,
  GroupID,
  Post,
  PostCursor,
  Range,
} from "@connect/api-client";
import {AccountProfileView} from "../tables/AccountTable";
import {GroupCollection} from "../entities/Group";
import {GroupTable} from "../tables/GroupTable";
import {PGClient} from "../PGClient";

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

  // TODO: Return null instead of error.
  if (group === undefined) throw new APIError(APIErrorCode.NOT_FOUND);

  return {group};
}

/**
 * Get posts in a group by reverse chronological order.
 */
export async function getPosts(
  ctx: {readonly groups: GroupCollection},
  accountID: AccountID,
  input: {readonly groupID: GroupID} & Range<PostCursor>,
): Promise<{
  readonly posts: ReadonlyArray<Post>;
}> {
  // Confirm that this account is a member of the group.
  const membership = await ctx.groups.getMembership(accountID, input.groupID);
  if (!membership) throw new APIError(APIErrorCode.NOT_FOUND);

  // Get a list of posts in reverse chronological order using the pagination
  // provided by our input.
  const posts = await ctx.groups.getPosts(membership, input);

  return {posts};
}

/**
 * Get profiles in a group.
 */
export async function getProfiles(
  ctx: {readonly client: PGClient},
  accountID: AccountID,
  input: {
    readonly groupID: GroupID;
    readonly ids: ReadonlyArray<AccountID>;
  },
): Promise<{
  readonly accounts: ReadonlyArray<AccountProfile>;
}> {
  // Select all the account profiles our client asked for. We use the group our
  // client provided as an optimization.
  const accounts = await AccountProfileView.select({
    id: AccountProfileView.id,
    name: AccountProfileView.name,
    avatarURL: AccountProfileView.avatar_url,
  })
    .where(AccountProfileView.id.any(input.ids))
    .execute(ctx.client, accountID);

  return {accounts};
}
