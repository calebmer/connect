import {AccountProfile, Group, GroupID, GroupMember} from "@connect/api-client";
import {Context} from "../Context";
import {sql} from "../pg/SQL";

/**
 * Gets a group by its slug, but only if the authenticated account is a member
 * of that group.
 *
 * If the group does not have a slug then we will look up a group by its ID.
 */
export async function getGroupBySlug(
  ctx: Context,
  input: {readonly slug: string},
): Promise<{readonly group: Group | null}> {
  const {
    rows: [row],
  } = await ctx.query(sql`
    SELECT id, slug, name
      FROM "group"
     WHERE ${
       isGroupID(input.slug)
         ? sql`id = ${input.slug}`
         : sql`slug = ${input.slug}`
     }
  `);

  if (row === undefined) {
    return {group: null};
  } else {
    return {
      group: {
        id: row.id,
        slug: row.slug,
        name: row.name,
      },
    };
  }
}

/**
 * Gets _all_ the memberships in a group. As we start to support larger and
 * larger groups we should introduce a function for getting only a few
 * memberships at a time.
 */
export async function getAllGroupMembers(
  ctx: Context,
  input: {readonly id: GroupID},
): Promise<{
  readonly memberships: ReadonlyArray<GroupMember>;
  readonly accounts: ReadonlyArray<AccountProfile>;
}> {
  const {rows} = await ctx.query(sql`
       SELECT group_member.group_id, group_member.joined_at,
              account_profile.id, account_profile.name, account_profile.avatar_url
         FROM group_member
    LEFT JOIN account_profile ON account_profile.id = group_member.account_id
        WHERE group_member.group_id = ${input.id}
  `);

  const memberships: Array<GroupMember> = [];
  const accounts: Array<AccountProfile> = [];

  rows.forEach(row => {
    const membership: GroupMember = {
      groupID: row.group_id,
      accountID: row.id,
      joinedAt: row.joined_at,
    };

    const account: AccountProfile = {
      id: row.id,
      name: row.name,
      avatarURL: row.avatar_url,
    };

    memberships.push(membership);
    accounts.push(account);
  });

  return {
    memberships,
    accounts,
  };
}

function isGroupID(slug: string): slug is GroupID {
  return slug.length >= 22;
}
