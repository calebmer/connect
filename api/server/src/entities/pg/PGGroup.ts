import {
  AccountID,
  DateTime,
  Group,
  GroupID,
  GroupMembership,
  Post,
} from "@connect/api-client";
import {GroupCollection} from "../Group";
import {PGClient} from "../../PGClient";
import {sql} from "pg-sql";

export class PGGroupCollection implements GroupCollection {
  constructor(private readonly client: PGClient) {}

  async getMembership(
    accountID: AccountID,
    groupID: GroupID,
  ): Promise<GroupMembership | undefined> {
    const {
      rows: [row],
    } = await this.client.query(
      "SELECT joined_at FROM group_member WHERE account_id = $1 AND group_id = $2",
      [accountID, groupID],
    );
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

  async getPosts(
    membership: GroupMembership,
    range: {after: DateTime | null; first: number},
  ): Promise<ReadonlyArray<Post>> {
    const conditions = [sql`group_id = ${sql.value(membership.groupID)}`];
    if (range.after !== null)
      conditions.push(sql`published_at < ${sql.value(range.after)}`);

    const {rows} = await this.client.query(
      sql`SELECT id, author_id, published_at, content FROM post WHERE ${sql.join(
        conditions,
        " AND ",
      )} ORDER BY published_at LIMIT ${sql.value(range.first)}`,
    );

    return rows.map(row => ({
      id: row.id,
      groupID: membership.groupID,
      authorID: row.author_id,
      publishedAt: row.published_at,
      content: row.content,
    }));
  }
}
