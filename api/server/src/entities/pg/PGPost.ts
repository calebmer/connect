import {AccountID, Post, PostID} from "@connect/api-client";
import {PGClient} from "../../PGClient";
import {sql} from "../../PGSQL";

export class PGPostCollection {
  constructor(private readonly client: PGClient) {}

  async get(accountID: AccountID, postID: PostID): Promise<Post | undefined> {
    const {
      rows: [row],
    } = await this.client.query(sql`
      SELECT post.group_id, post.author_id, post.published_at, post.content
      FROM post
      LEFT JOIN group_member ON group_member.group_id = post.group_id
      WHERE post.id = ${sql.value(
        postID,
      )} AND group_member.account_id = ${sql.value(accountID)}
    `);
    if (row === undefined) {
      return undefined;
    } else {
      return {
        id: postID,
        groupID: row.group_id,
        authorID: row.author_id,
        publishedAt: row.published_at,
        content: row.content,
      };
    }
  }
}
