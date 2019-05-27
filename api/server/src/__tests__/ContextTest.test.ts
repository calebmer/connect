import {AccountID} from "@connect/api-client";
import {ContextQueryable} from "../Context";
import {ContextTest} from "../ContextTest";
import {sql} from "../pg/SQL";

async function getRole(ctx: ContextQueryable): Promise<string> {
  const {
    rows: [row],
  } = await ctx.query(sql`SELECT current_user`);
  return row.current_user;
}

async function getCurrentAccountID(
  ctx: ContextQueryable,
): Promise<AccountID | null> {
  const {
    rows: [row],
  } = await ctx.query(
    sql`SELECT current_setting('connect.account_id', true) as account_id`,
  );
  if (row.account_id) {
    return row.account_id as AccountID;
  } else {
    return null;
  }
}

test("runs with a privileged role", () => {
  return ContextTest.with(async ctx => {
    expect(await getRole(ctx)).toEqual("connect_api_test");
  });
});

test("rolls back the changes in a failed transaction while testing", async () => {
  try {
    await ContextTest.with(async ctx => {
      await ctx.query(sql`CREATE TABLE public.test (id INT PRIMARY KEY)`);
      await ctx.query(sql`INSERT INTO public.test (id) VALUES (1), (2), (3)`);
      const {rowCount} = await ctx.query(sql`SELECT * FROM public.test`);
      expect(rowCount).toEqual(3);
      throw new Error("fail");
    });
  } catch (e) {
    // noop
  }
  await ContextTest.with(async ctx => {
    let error;
    try {
      await ctx.query(sql`SELECT * FROM public.test`);
    } catch (e) {
      error = e;
    }
    expect(error).not.toBe(undefined);
    expect(error.message).toContain("does not exist");
  });
});

test("rolls back the changes in a successful transaction while testing", async () => {
  await ContextTest.with(async ctx => {
    await ctx.query(sql`CREATE TABLE public.test (id INT PRIMARY KEY)`);
    await ctx.query(sql`INSERT INTO public.test (id) VALUES (1), (2), (3)`);
    const {rowCount} = await ctx.query(sql`SELECT * FROM public.test`);
    expect(rowCount).toEqual(3);
  });
  await ContextTest.with(async ctx => {
    let error;
    try {
      await ctx.query(sql`SELECT * FROM public.test`);
    } catch (e) {
      error = e;
    }
    expect(error).not.toBe(undefined);
    expect(error.message).toContain("does not exist");
  });
});

test("forks an unauthorized context with the scoped appropriate role", () => {
  return ContextTest.with(async ctx => {
    expect(await getRole(ctx)).toEqual("connect_api_test");
    await ctx.withUnauthorized(async ctx => {
      expect(await getRole(ctx)).toEqual("connect_api");
    });
    expect(await getRole(ctx)).toEqual("connect_api_test");
  });
});

test("forks an unauthorized context with the scoped appropriate role even when an error is thrown", () => {
  return ContextTest.with(async ctx => {
    expect(await getRole(ctx)).toEqual("connect_api_test");
    await ctx
      .withUnauthorized(async ctx => {
        expect(await getRole(ctx)).toEqual("connect_api");
        throw new Error("test");
      })
      .catch(() => {});
    expect(await getRole(ctx)).toEqual("connect_api_test");
  });
});

test("forks an authorized context with the scoped appropriate role", () => {
  return ContextTest.with(async ctx => {
    expect(await getRole(ctx)).toEqual("connect_api_test");
    await ctx.withAuthorized(42 as any, async ctx => {
      expect(await getRole(ctx)).toEqual("connect_api");
    });
    expect(await getRole(ctx)).toEqual("connect_api_test");
  });
});

test("forks an authorized context with the scoped appropriate role even when an error is thrown", () => {
  return ContextTest.with(async ctx => {
    expect(await getRole(ctx)).toEqual("connect_api_test");
    await ctx
      .withAuthorized(42 as any, async ctx => {
        expect(await getRole(ctx)).toEqual("connect_api");
        throw new Error("test");
      })
      .catch(() => {});
    expect(await getRole(ctx)).toEqual("connect_api_test");
  });
});

test("forks an unauthorized context with the scoped appropriate account ID setting", () => {
  return ContextTest.with(async ctx => {
    expect(await getCurrentAccountID(ctx)).toEqual(null);
    await ctx.withUnauthorized(async ctx => {
      expect(await getCurrentAccountID(ctx)).toEqual(null);
    });
    expect(await getCurrentAccountID(ctx)).toEqual(null);
  });
});

test("forks an authorized context with the scoped appropriate account ID setting", () => {
  return ContextTest.with(async ctx => {
    expect(await getCurrentAccountID(ctx)).toEqual(null);
    await ctx.withAuthorized(42 as any, async ctx => {
      expect(await getCurrentAccountID(ctx)).toEqual(42);
    });
    expect(await getCurrentAccountID(ctx)).toEqual(null);
  });
});

test("forks an authorized context with the scoped appropriate account ID setting even when an error is thrown", () => {
  return ContextTest.with(async ctx => {
    expect(await getCurrentAccountID(ctx)).toEqual(null);
    await ctx
      .withAuthorized(42 as any, async ctx => {
        expect(await getCurrentAccountID(ctx)).toEqual(42);
        throw new Error("test");
      })
      .catch(() => {});
    expect(await getCurrentAccountID(ctx)).toEqual(null);
  });
});
