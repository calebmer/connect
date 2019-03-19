import {
  AccountID,
  Group,
  GroupID,
  GroupMembership,
  Post,
  PostCursor,
  Range,
} from "@connect/api-client";
import {GroupCollection} from "../Group";
import {PGClient} from "../../PGClient";
import {PGPagination} from "../../PGPagination";
import {sql} from "../../PGSQL";

const PGPostPagination = new PGPagination(sql`post`, [
  {column: sql`published_at`, descending: true},
  {column: sql`id`},
]);

export class PGGroupCollection implements GroupCollection {
  constructor(private readonly client: PGClient) {}

  async getMembership(
    accountID: AccountID,
    groupID: GroupID,
  ): Promise<GroupMembership | undefined> {
    const {
      rows: [row],
    } = await this.client.query(sql`
      SELECT joined_at FROM group_member
      WHERE account_id = ${accountID} AND group_id = ${groupID}
    `);
    if (row === undefined) {
      return undefined;
    } else {
      return {
        accountID,
        groupID,
        joinedAt: row.joined_at,
      };
    }
  }

  async getMembershipWithSlug(
    accountID: AccountID,
    groupSlug: string,
  ): Promise<GroupMembership | undefined> {
    // NOTE: We should be able to resolve this query with two index scans. One
    // to the group slug index. One to the group member compound primary
    // key index.
    const {
      rows: [row],
    } = await this.client.query(sql`
      SELECT group_member.group_id, group_member.joined_at
      FROM group_member
      LEFT JOIN "group" ON "group".id = group_member.group_id
      WHERE group_member.account_id = ${accountID} AND "group".slug = ${groupSlug}
    `);
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
      sql`SELECT slug, name FROM "group" WHERE id = ${membership.groupID}`,
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

  async getPosts(
    membership: GroupMembership,
    range: Range<PostCursor>,
  ): Promise<ReadonlyArray<Post>> {
    const {rows} = await PGPostPagination.query(this.client, {
      selection: sql`id, author_id, published_at, content`,
      extraCondition: sql`group_id = ${membership.groupID}`,
      range,
    });
    return rows.map(row => ({
      id: row.id,
      groupID: membership.groupID,
      authorID: row.author_id,
      publishedAt: row.published_at,
      content: row.content,
    }));
  }
}
