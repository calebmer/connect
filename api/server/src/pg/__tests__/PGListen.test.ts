import {PGListen, PGListenChannel} from "../PGListen";

const testChannel = PGListenChannel.create<string>("test");

test("will listen to no notifications", async () => {
  const logs: Array<string> = [];

  const unlisten = await PGListen.listen(testChannel, payload => {
    logs.push(payload);
  });

  await unlisten();

  expect(logs).toEqual([]);
});

test("will listen to one notification", async () => {
  const logs: Array<string> = [];

  const unlisten = await PGListen.listen(testChannel, payload => {
    logs.push(payload);
  });

  await PGListen.notify(testChannel, "foo");

  await unlisten();

  expect(logs).toEqual(["foo"]);
});

test("will listen to two notifications", async () => {
  const logs: Array<string> = [];

  const unlisten = await PGListen.listen(testChannel, payload => {
    logs.push(payload);
  });

  await PGListen.notify(testChannel, "foo");
  await PGListen.notify(testChannel, "bar");

  await unlisten();

  expect(logs).toEqual(["foo", "bar"]);
});

test("will not listen to notifications after un-listening", async () => {
  const logs: Array<string> = [];

  const unlisten = await PGListen.listen(testChannel, payload => {
    logs.push(payload);
  });

  await PGListen.notify(testChannel, "foo");

  await unlisten();

  await PGListen.notify(testChannel, "bar");

  expect(logs).toEqual(["foo"]);
});
