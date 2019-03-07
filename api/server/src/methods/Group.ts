import {SQLQuery, sql} from "pg-sql";
import {Context} from "../Context";
import {Group} from "@connect/api-client";

export async function getGroup(
  ctx: Context,
  {id}: {readonly id: number},
): Promise<Group> {
  const [group] = await selectGroups(ctx, sql`id = ${sql.value(id)}`);
}

export async function getGroupBySlug(
  ctx: Context,
  {slug}: {readonly slug: string},
): Promise<Group> {
  const [group] = await selectGroups(ctx, sql`slug = ${sql.value(slug)}`);
}

async function selectGroups(
  ctx: Context,
  condition: SQLQuery,
): Promise<ReadonlyArray<Group>> {
  const {rows} = await ctx.database.query(sql`
    SELECT
      id,
      slug,
      display_name as "displayName",
      owner_id as "ownerID",
      created_at as "createdAt"
    FROM group
    WHERE
      (${condition}) AND
      (SELECT true
       FROM group_member
       WHERE
        account_id = ${sql.value(ctx.accountID)} AND
        group_id = id)
  `);
  return rows;
}
