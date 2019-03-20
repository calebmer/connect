import {
  AccountID,
  AccountProfile,
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
      WHERE account_id = ${sql.value(accountID)} AND group_id = ${sql.value(
      groupID,
    )}
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
      WHERE group_member.account_id = ${sql.value(
        accountID,
      )} AND "group".slug = ${sql.value(groupSlug)}
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

  async get({groupID}: GroupMembership): Promise<Group> {
    const {
      rows: [row],
    } = await this.client.query(
      sql`SELECT slug, name FROM "group" WHERE id = ${sql.value(groupID)}`,
    );
    if (row === undefined) {
      throw new Error(
        "Expected group membership to reference an existing group.",
      );
    }
    return {
      id: groupID,
      slug: row.slug,
      name: row.name,
    };
  }

  async getPosts(
    {groupID}: GroupMembership,
    range: Range<PostCursor>,
  ): Promise<ReadonlyArray<Post>> {
    const {rows} = await PGPostPagination.query(this.client, {
      selection: sql`id, author_id, published_at, content`,
      extraCondition: sql`group_id = ${sql.value(groupID)}`,
      range,
    });
    return rows.map(row => ({
      id: row.id,
      groupID: groupID,
      authorID: row.author_id,
      publishedAt: row.published_at,
      content: row.content,
    }));
  }

  async getProfiles(
    {groupID}: GroupMembership,
    accountIDs: ReadonlyArray<AccountID>,
  ): Promise<ReadonlyArray<AccountProfile>> {
    const {rows} = await this.client.query(sql`
      SELECT account.id, account.name, account.avatar_url
      FROM group_member
      LEFT JOIN account ON account.id = group_member.account_id
      WHERE
        group_member.account_id = ANY (${sql.value(accountIDs)}) AND
        group_member.group_id = ${sql.value(groupID)}
    `);
    return rows.map(row => ({
      id: row.id,
      name: row.name,
      avatarURL: row.avatar_url,
    }));
  }

  async sharedMembership(
    accountID1: AccountID,
    accountID2: AccountID,
  ): Promise<boolean> {
    const {rowCount} = await this.client.query(sql`
      SELECT 1
      FROM group_member as group_member1
      LEFT JOIN group_member as group_member2
        ON group_member2.group_id = group_member1.group_id
      WHERE
        group_member1.account_id = ${sql.value(accountID1)} AND
        group_member2.account_id = ${sql.value(accountID2)}
      LIMIT 1
    `);
    return rowCount > 0;
  }
}
