import {AccountID, Group, GroupMembership} from "@connect/api-client";
import {GroupCollection} from "../Group";
import {PGClient} from "../../PGClient";

export class PGGroupCollection implements GroupCollection {
  constructor(private readonly client: PGClient) {}

  async getMembership(
    accountID: AccountID,
    groupSlug: string,
  ): Promise<GroupMembership | undefined> {
    // NOTE: We should be able to resolve this query with two index scans. One
    // to the group slug index. One to the group member compound primary
    // key index.
    const {
      rows: [row],
    } = await this.client.query(
      "SELECT group_member.group_id, group_member.joined_at FROM group_member " +
        'LEFT JOIN "group" ON "group".id = group_member.group_id ' +
        'WHERE group_member.account_id = $1 AND "group".slug = $2',
      [accountID, groupSlug],
    );
    if (row === undefined) {
      return undefined;
    } else {
      return {
        accountID,
        groupID: row.group_id,
        joinedAt: row.joined_at,
      };
    }
  }

  async get(membership: GroupMembership): Promise<Group> {
    const {
      rows: [row],
    } = await this.client.query(
      'SELECT slug, name FROM "group" WHERE id = $1',
      [membership.groupID],
    );
    if (row === undefined) {
      throw new Error(
        "Expected group membership to reference an existing group.",
      );
    }
    return {
      id: membership.groupID,
      slug: row.slug,
      name: row.name,
    };
  }
}
