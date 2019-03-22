import {PGClient} from "../PGClient";

test("uses the API role", async () => {
  await PGClient.with(async client => {
    const {
      rows: [row],
    } = await client.query("SELECT current_user");
    expect(row.current_user).toEqual("connect_api");
  });
});

test("rolls back the changes in a failed transaction while testing", async () => {
  try {
    await PGClient.with(async client => {
      await client.query("CREATE TABLE public.test (id INT PRIMARY KEY)");
      await client.query("INSERT INTO public.test (id) VALUES (1), (2), (3)");
      const {rowCount} = await client.query("SELECT * FROM public.test");
      expect(rowCount).toEqual(3);
      throw new Error("fail");
    });
  } catch (e) {
    // noop
  }
  await PGClient.with(async client => {
    let error;
    try {
      await client.query("SELECT * FROM public.test");
    } catch (e) {
      error = e;
    }
    expect(error).not.toBe(undefined);
    expect(error.message).toContain("does not exist");
  });
});

test("rolls back the changes in a successful transaction while testing", async () => {
  await PGClient.with(async client => {
    await client.query("CREATE TABLE public.test (id INT PRIMARY KEY)");
    await client.query("INSERT INTO public.test (id) VALUES (1), (2), (3)");
    const {rowCount} = await client.query("SELECT * FROM public.test");
    expect(rowCount).toEqual(3);
  });
  await PGClient.with(async client => {
    let error;
    try {
      await client.query("SELECT * FROM public.test");
    } catch (e) {
      error = e;
    }
    expect(error).not.toBe(undefined);
    expect(error.message).toContain("does not exist");
  });
});
