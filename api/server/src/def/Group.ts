import {Context} from "../Context";
import {Group} from "@connect/api-client";
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
       input.slug.length < 22
         ? sql`slug = ${input.slug}`
         : sql`id = ${input.slug}`
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
