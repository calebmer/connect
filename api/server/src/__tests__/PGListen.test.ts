import {ContextTest} from "../ContextTest";
import {PGListen} from "../PGListen";

function wait(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

test("will listen to no notifications", async () => {
  const logs: Array<string | undefined> = [];

  const unlisten = await PGListen.listen("test", payload => {
    logs.push(payload);
  });

  await unlisten();

  expect(logs).toEqual([]);
});

test("will listen to one notification", async () => {
  const logs: Array<string | undefined> = [];

  const unlisten = await PGListen.listen("test", payload => {
    logs.push(payload);
  });

  await ContextTest.with(async ctx => {
    ctx.withUnauthorized(async ctx => {
      PGListen.notify(ctx, "test", "foo");
    });
  });

  await wait(200);
  await unlisten();

  expect(logs).toEqual(["foo"]);
});

test("will listen to two notifications", async () => {
  const logs: Array<string | undefined> = [];

  const unlisten = await PGListen.listen("test", payload => {
    logs.push(payload);
  });

  await ContextTest.with(async ctx => {
    ctx.withUnauthorized(async ctx => {
      PGListen.notify(ctx, "test", "foo");
      PGListen.notify(ctx, "test", "bar");
    });
  });

  await wait(200);
  await unlisten();

  expect(logs).toEqual(["foo", "bar"]);
});

test("will listen to two notifications from different contexts", async () => {
  const logs: Array<string | undefined> = [];

  const unlisten = await PGListen.listen("test", payload => {
    logs.push(payload);
  });

  await ContextTest.with(async ctx => {
    ctx.withUnauthorized(async ctx => {
      PGListen.notify(ctx, "test", "foo");
    });
  });

  await ContextTest.with(async ctx => {
    ctx.withUnauthorized(async ctx => {
      PGListen.notify(ctx, "test", "bar");
    });
  });

  await wait(200);
  await unlisten();

  expect(logs).toEqual(["foo", "bar"]);
});

test("will not listen to notifications after un-listening", async () => {
  const logs: Array<string | undefined> = [];

  const unlisten = await PGListen.listen("test", payload => {
    logs.push(payload);
  });

  await ContextTest.with(async ctx => {
    ctx.withUnauthorized(async ctx => {
      PGListen.notify(ctx, "test", "foo");
    });
  });

  await wait(200);
  await unlisten();

  await ContextTest.with(async ctx => {
    ctx.withUnauthorized(async ctx => {
      PGListen.notify(ctx, "test", "bar");
    });
  });

  await wait(200);
  expect(logs).toEqual(["foo"]);
});
