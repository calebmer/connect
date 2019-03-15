import {AccountID, Group} from "@connect/api-client";
import {GroupCollection} from "../entities/Group";

/**
 * Gets a group by its slug, but only if the authenticated account is a member
 * of that group.
 */
export async function getBySlug(
  ctx: {readonly groups: GroupCollection},
  accountID: AccountID,
  input: {readonly slug: string},
): Promise<{readonly group: Group | null}> {
  // First get this account’s membership in the group. If the account does not
  // have a membership then pretend that the group does not exist by
  // returning null.
  const membership = await ctx.groups.getMembership(accountID, input.slug);
  if (!membership) return {group: null};

  // We can safely get the group data now!
  const group = await ctx.groups.get(membership);
  return {group};
}
