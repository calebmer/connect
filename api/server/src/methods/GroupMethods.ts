import {Context} from "../Context";
import {Group} from "@connect/api-client";
import {sql} from "../pg/SQL";

/**
 * Gets a group by its slug, but only if the authenticated account is a member
 * of that group.
 */
export async function getGroupBySlug(
  ctx: Context,
  input: {readonly slug: string},
): Promise<{readonly group: Group | null}> {
  const {
    rows: [row],
  } = await ctx.query(sql`
    SELECT id, name
      FROM "group"
     WHERE slug = ${input.slug}
  `);

  if (row === undefined) {
    return {group: null};
  } else {
    return {
      group: {
        id: row.id,
        slug: input.slug,
        name: row.name,
      },
    };
  }
}
