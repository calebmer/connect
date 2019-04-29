import {generateID} from "../generateID";

test("always generates IDs that are 22 characters long", () => {
  for (let i = 0; i < 256; i++) {
    expect(generateID().length).toEqual(22);
  }
});

test("always generates IDs that can be lexicographically sorted when they are generated 1ms apart", async () => {
  const expected = [];

  for (let i = 0; i < 256; i++) {
    expected.push(generateID());

    // Wait for the time as represented by `Date.now()` to change. We keep
    // waiting for 1ms with `setTimeout()` until it changes.
    await new Promise(resolve => {
      const start = Date.now();

      function wait() {
        setTimeout(() => {
          if (start !== Date.now()) {
            resolve();
          } else {
            wait();
          }
        }, 1);
      }

      wait();
    });
  }

  const actual = [...expected].sort();

  expect(expected).toEqual(actual);
});
