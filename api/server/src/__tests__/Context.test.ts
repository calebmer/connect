import {Context, ContextQueryable} from "../Context";
import {AccountID} from "@connect/api-client";
import {sql} from "../PGSQL";

async function getCurrentAccountID(
  ctx: ContextQueryable,
): Promise<AccountID | null> {
  const {
    rows: [row],
  } = await ctx.query(
    sql`SELECT current_setting('connect.account_id', true) as account_id`,
  );
  if (row.account_id) {
    const id = parseInt(row.account_id, 10);
    if (!Number.isInteger(id)) {
      throw new Error(`Not an integer: ${JSON.stringify(row.account_id)}`);
    }
    return id as AccountID;
  } else {
    return null;
  }
}

test("sets the current account ID in the current transaction only", async () => {
  await Context.withUnauthorized(async ctx => {
    expect(await getCurrentAccountID(ctx)).toEqual(null);
  });
  await Context.withAuthorized(42 as any, async ctx => {
    expect(await getCurrentAccountID(ctx)).toEqual(42);
  });
  await Context.withUnauthorized(async ctx => {
    expect(await getCurrentAccountID(ctx)).toEqual(null);
  });
});

test("sets the current account ID in the current transaction only even when an error is thrown", async () => {
  await Context.withUnauthorized(async ctx => {
    expect(await getCurrentAccountID(ctx)).toEqual(null);
  });
  await Context.withAuthorized(42 as any, async ctx => {
    expect(await getCurrentAccountID(ctx)).toEqual(42);
    throw new Error("test");
  }).catch(() => {});
  await Context.withUnauthorized(async ctx => {
    expect(await getCurrentAccountID(ctx)).toEqual(null);
  });
});