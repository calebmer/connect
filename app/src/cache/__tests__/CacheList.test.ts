import {Cursor, RangeDirection} from "@connect/api-client";
import {CacheList} from "../CacheList";

type TestRange = {
  direction: "first" | "last";
  count: number;
  after?: number;
  before?: number;
};

function testCacheList(
  allItems: ReadonlyArray<number>,
  recordCalls?: Array<TestRange>,
): CacheList<Cursor<number>, number> {
  return new CacheList({
    key: item => item,
    cursor: item => Cursor.encode(item),
    load: async range => {
      const after = range.after && Cursor.decode(range.after);
      const before = range.before && Cursor.decode(range.before);

      if (recordCalls) {
        const testRange: TestRange = {
          direction: range.direction,
          count: range.count,
        };
        if (after !== null) testRange.after = after;
        if (before !== null) testRange.before = before;
        recordCalls.push(testRange);
      }

      const items: Array<number> = [];

      if (range.direction === RangeDirection.First) {
        for (let i = 0; i < allItems.length; i++) {
          const item = allItems[i];
          if (after != null && !(item > after)) continue;
          if (before != null && !(item < before)) break;
          if (items.length >= range.count) break;
          items.push(item);
        }
      } else {
        for (let i = allItems.length - 1; i >= 0; i--) {
          const item = allItems[i];
          if (after != null && !(item > after)) break;
          if (before != null && !(item < before)) continue;
          if (items.length >= range.count) break;
          items.push(item);
        }
        items.reverse();
      }

      return items;
    },
  });
}

describe("loadFirst", () => {
  test("will load no items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(0)).toEqual([]);
    expect(recordCalls).toEqual([{direction: "first", count: 0}]);
  });

  test("will load the first item from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(1)).toEqual([201]);
    expect(recordCalls).toEqual([{direction: "first", count: 1}]);
  });

  test("will load the first three items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    expect(recordCalls).toEqual([{direction: "first", count: 3}]);
  });

  test("will load the first five items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(5)).toEqual([201, 202, 203, 204, 205]);
    expect(recordCalls).toEqual([{direction: "first", count: 5}]);
  });

  test("will load no items from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(0)).toEqual([]);
    expect(await cache.loadFirst(0)).toEqual([]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 0},
      {direction: "first", count: 0},
    ]);
  });

  test("will load the first item from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(1)).toEqual([201]);
    expect(await cache.loadFirst(1)).toEqual([201]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 1},
      {direction: "first", count: 1, before: 201},
    ]);
  });

  test("will load the first three items from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, before: 201},
    ]);
  });

  test("will load the first five items from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(5)).toEqual([201, 202, 203, 204, 205]);
    expect(await cache.loadFirst(5)).toEqual([201, 202, 203, 204, 205]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 5},
      {direction: "first", count: 5, before: 201},
    ]);
  });

  test("will NOT load three items then five items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    expect(await cache.loadFirst(5)).toEqual([201, 202, 203]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 5, before: 201},
    ]);
  });

  test("will load five items then three items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(5)).toEqual([201, 202, 203, 204, 205]);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203, 204, 205]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 5},
      {direction: "first", count: 3, before: 201},
    ]);
  });

  test("will load zero items then five items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(0)).toEqual([]);
    expect(await cache.loadFirst(5)).toEqual([201, 202, 203, 204, 205]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 0},
      {direction: "first", count: 5},
    ]);
  });

  test("will load five items then zero items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(5)).toEqual([201, 202, 203, 204, 205]);
    expect(await cache.loadFirst(0)).toEqual([201, 202, 203, 204, 205]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 5},
      {direction: "first", count: 0, before: 201},
    ]);
  });

  test("will load newly pushed items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    items.unshift(101, 102, 103);
    expect(await cache.loadFirst(3)).toEqual([101, 102, 103]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, before: 201},
    ]);
  });

  test("will load and merge newly pushed items with previously cached items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    items.unshift(101, 102);
    expect(await cache.loadFirst(3)).toEqual([101, 102, 201, 202, 203]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, before: 201},
    ]);
  });

  test("will load some newly pushed items which have more", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    items.unshift(101, 102, 103, 104);
    expect(await cache.loadFirst(3)).toEqual([101, 102, 103]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, before: 201},
    ]);
  });

  test("will load some newly pushed items but a short load next won’t merge with previously cached items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    items.unshift(101, 102, 103, 104, 105, 106);
    expect(await cache.loadFirst(3)).toEqual([101, 102, 103]);
    expect(await cache.loadNext(3)).toEqual([101, 102, 103, 104, 105, 106]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, before: 201},
      {direction: "first", count: 3, after: 103, before: 201},
    ]);
  });

  test("will load newly pushed items and a load next will merge the with previously cached items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    items.unshift(101, 102, 103);
    expect(await cache.loadFirst(3)).toEqual([101, 102, 103]);
    expect(await cache.loadNext(0)).toEqual([101, 102, 103]);
    expect(await cache.loadNext(1)).toEqual([101, 102, 103, 201, 202, 203]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, before: 201},
      {direction: "first", count: 0, after: 103, before: 201},
      {direction: "first", count: 1, after: 103, before: 201},
    ]);
  });

  test("will load some newly pushed items and a load next will merge the with previously cached items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    items.unshift(101, 102, 103, 104);
    expect(await cache.loadFirst(3)).toEqual([101, 102, 103]);
    expect(await cache.loadNext(0)).toEqual([101, 102, 103]);
    expect(await cache.loadNext(2)).toEqual([
      101,
      102,
      103,
      104,
      201,
      202,
      203,
    ]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, before: 201},
      {direction: "first", count: 0, after: 103, before: 201},
      {direction: "first", count: 2, after: 103, before: 201},
    ]);
  });

  test("will run twice in parallel successfully", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await Promise.all([cache.loadFirst(3), cache.loadFirst(3)])).toEqual(
      [[201, 202, 203], [201, 202, 203]],
    );
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, before: 201},
    ]);
  });

  test("will run thrice in parallel successfully", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(
      await Promise.all([
        cache.loadFirst(3),
        cache.loadFirst(3),
        cache.loadFirst(3),
      ]),
    ).toEqual([[201, 202, 203], [201, 202, 203], [201, 202, 203]]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, before: 201},
      {direction: "first", count: 3, before: 201},
    ]);
  });
});

describe("loadNext", () => {
  test("will load no items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadNext(0)).toEqual([]);
    expect(recordCalls).toEqual([{direction: "first", count: 0}]);
  });

  test("will load the first item from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadNext(1)).toEqual([201]);
    expect(recordCalls).toEqual([{direction: "first", count: 1}]);
  });

  test("will load the first three items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadNext(3)).toEqual([201, 202, 203]);
    expect(recordCalls).toEqual([{direction: "first", count: 3}]);
  });

  test("will load the first five items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadNext(5)).toEqual([201, 202, 203, 204, 205]);
    expect(recordCalls).toEqual([{direction: "first", count: 5}]);
  });

  test("will load no items from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadNext(0)).toEqual([]);
    expect(await cache.loadNext(0)).toEqual([]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 0},
      {direction: "first", count: 0},
    ]);
  });

  test("will load the first item from a list many times", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadNext(1)).toEqual([201]);
    expect(await cache.loadNext(1)).toEqual([201, 202]);
    expect(await cache.loadNext(1)).toEqual([201, 202, 203]);
    expect(await cache.loadNext(1)).toEqual([201, 202, 203, 204]);
    expect(await cache.loadNext(1)).toEqual([201, 202, 203, 204, 205]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 1},
      {direction: "first", count: 1, after: 201},
      {direction: "first", count: 1, after: 202},
      {direction: "first", count: 1, after: 203},
      {direction: "first", count: 1, after: 204},
    ]);
  });

  test("will load the first two items from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadNext(2)).toEqual([201, 202]);
    expect(await cache.loadNext(2)).toEqual([201, 202, 203, 204]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 2},
      {direction: "first", count: 2, after: 202},
    ]);
  });

  test("will load the first item after loading some initial items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(2)).toEqual([201, 202]);
    expect(await cache.loadFirst(2)).toEqual([201, 202]);
    expect(await cache.loadNext(2)).toEqual([201, 202, 203, 204]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 2},
      {direction: "first", count: 2, before: 201},
      {direction: "first", count: 2, after: 202},
    ]);
  });

  test("will load some new first items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [301, 302, 303];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(2)).toEqual([301, 302]);
    items.unshift(201, 202, 203);
    expect(await cache.loadFirst(2)).toEqual([201, 202]);
    expect(await cache.loadNext(2)).toEqual([201, 202, 203, 301, 302]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 2},
      {direction: "first", count: 2, before: 301},
      {direction: "first", count: 2, after: 202, before: 301},
    ]);
  });

  test("will ignore new items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    items.unshift(101, 102, 103, 104, 105);
    expect(await cache.loadNext(3)).toEqual([201, 202, 203, 204, 205, 206]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, after: 203},
    ]);
  });

  test("will NOT load until count has been filled", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [107, 108, 109];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(2)).toEqual([107, 108]);
    items.unshift(104, 105, 106);
    expect(await cache.loadFirst(2)).toEqual([104, 105]);
    items.unshift(101, 102, 103);
    expect(await cache.loadFirst(2)).toEqual([101, 102]);
    expect(await cache.loadNext(100)).toEqual([101, 102, 103, 104, 105]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 2},
      {direction: "first", count: 2, before: 107},
      {direction: "first", count: 2, before: 104},
      {direction: "first", count: 100, after: 102, before: 104},
    ]);
  });

  test("will meet in the middle with load last", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadNext(5)).toEqual([201, 202, 203, 204, 205]);
    expect(await cache.loadLast(5)).toEqual([206, 207, 208, 209, 210]);
    expect(await cache.loadNext(1)).toEqual(items);
    expect(recordCalls).toEqual([
      {direction: "first", count: 5},
      {direction: "last", count: 5, after: 205},
      {direction: "first", count: 1, after: 205, before: 206},
    ]);
  });

  test("will load next after load last", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    expect(await cache.loadNext(3)).toEqual([208, 209, 210]);
    items.push(301, 302, 303, 304, 305);
    expect(await cache.loadNext(3)).toEqual([208, 209, 210, 301, 302, 303]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "first", count: 3, after: 210},
      {direction: "first", count: 3, after: 210},
    ]);
  });

  test("will run twice in parallel successfully", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await Promise.all([cache.loadNext(3), cache.loadNext(3)])).toEqual([
      [201, 202, 203],
      [201, 202, 203, 204, 205, 206],
    ]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 3, after: 203},
    ]);
  });

  test("will run thrice in parallel successfully", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(
      await Promise.all([
        cache.loadNext(2),
        cache.loadNext(2),
        cache.loadNext(2),
      ]),
    ).toEqual([
      [201, 202],
      [201, 202, 203, 204],
      [201, 202, 203, 204, 205, 206],
    ]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 2},
      {direction: "first", count: 2, after: 202},
      {direction: "first", count: 2, after: 204},
    ]);
  });
});

describe("loadLast", () => {
  test("will load no items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(0)).toEqual([]);
    expect(recordCalls).toEqual([{direction: "last", count: 0}]);
  });

  test("will load the first item from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(1)).toEqual([210]);
    expect(recordCalls).toEqual([{direction: "last", count: 1}]);
  });

  test("will load the first three items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    expect(recordCalls).toEqual([{direction: "last", count: 3}]);
  });

  test("will load the first five items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(5)).toEqual([206, 207, 208, 209, 210]);
    expect(recordCalls).toEqual([{direction: "last", count: 5}]);
  });

  test("will load no items from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(0)).toEqual([]);
    expect(await cache.loadLast(0)).toEqual([]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 0},
      {direction: "last", count: 0},
    ]);
  });

  test("will load the first item from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(1)).toEqual([210]);
    expect(await cache.loadLast(1)).toEqual([210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 1},
      {direction: "last", count: 1, after: 210},
    ]);
  });

  test("will load the first three items from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, after: 210},
    ]);
  });

  test("will load the first five items from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(5)).toEqual([206, 207, 208, 209, 210]);
    expect(await cache.loadLast(5)).toEqual([206, 207, 208, 209, 210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 5},
      {direction: "last", count: 5, after: 210},
    ]);
  });

  test("will NOT load three items then five items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    expect(await cache.loadLast(5)).toEqual([208, 209, 210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 5, after: 210},
    ]);
  });

  test("will load five items then three items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(5)).toEqual([206, 207, 208, 209, 210]);
    expect(await cache.loadLast(3)).toEqual([206, 207, 208, 209, 210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 5},
      {direction: "last", count: 3, after: 210},
    ]);
  });

  test("will load zero items then five items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(0)).toEqual([]);
    expect(await cache.loadLast(5)).toEqual([206, 207, 208, 209, 210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 0},
      {direction: "last", count: 5},
    ]);
  });

  test("will load five items then zero items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(5)).toEqual([206, 207, 208, 209, 210]);
    expect(await cache.loadLast(0)).toEqual([206, 207, 208, 209, 210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 5},
      {direction: "last", count: 0, after: 210},
    ]);
  });

  test("will load newly pushed items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    items.push(301, 302, 303);
    expect(await cache.loadLast(3)).toEqual([301, 302, 303]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, after: 210},
    ]);
  });

  test("will load and merge newly pushed items with previously cached items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    items.push(301, 302);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210, 301, 302]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, after: 210},
    ]);
  });

  test("will load some newly pushed items which have more", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    items.push(301, 302, 303, 304);
    expect(await cache.loadLast(3)).toEqual([302, 303, 304]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, after: 210},
    ]);
  });

  test("will load some newly pushed items but a short load prev won’t merge with previously cached items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    items.push(301, 302, 303, 304, 305, 306);
    expect(await cache.loadLast(3)).toEqual([304, 305, 306]);
    expect(await cache.loadPrev(3)).toEqual([301, 302, 303, 304, 305, 306]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, after: 210},
      {direction: "last", count: 3, after: 210, before: 304},
    ]);
  });

  test("will load newly pushed items and a load next will merge the with previously cached items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    items.push(301, 302, 303);
    expect(await cache.loadLast(3)).toEqual([301, 302, 303]);
    expect(await cache.loadPrev(0)).toEqual([301, 302, 303]);
    expect(await cache.loadPrev(1)).toEqual([208, 209, 210, 301, 302, 303]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, after: 210},
      {direction: "last", count: 0, after: 210, before: 301},
      {direction: "last", count: 1, after: 210, before: 301},
    ]);
  });

  test("will load some newly pushed items and a load next will merge the with previously cached items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    items.push(301, 302, 303, 304);
    expect(await cache.loadLast(3)).toEqual([302, 303, 304]);
    expect(await cache.loadPrev(0)).toEqual([302, 303, 304]);
    expect(await cache.loadPrev(2)).toEqual([
      208,
      209,
      210,
      301,
      302,
      303,
      304,
    ]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, after: 210},
      {direction: "last", count: 0, after: 210, before: 302},
      {direction: "last", count: 2, after: 210, before: 302},
    ]);
  });

  test("will run twice in parallel successfully", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await Promise.all([cache.loadLast(3), cache.loadLast(3)])).toEqual([
      [208, 209, 210],
      [208, 209, 210],
    ]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, after: 210},
    ]);
  });

  test("will run thrice in parallel successfully", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(
      await Promise.all([
        cache.loadLast(3),
        cache.loadLast(3),
        cache.loadLast(3),
      ]),
    ).toEqual([[208, 209, 210], [208, 209, 210], [208, 209, 210]]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, after: 210},
      {direction: "last", count: 3, after: 210},
    ]);
  });
});

describe("loadPrev", () => {
  test("will load no items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadPrev(0)).toEqual([]);
    expect(recordCalls).toEqual([{direction: "last", count: 0}]);
  });

  test("will load the first item from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadPrev(1)).toEqual([210]);
    expect(recordCalls).toEqual([{direction: "last", count: 1}]);
  });

  test("will load the first three items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadPrev(3)).toEqual([208, 209, 210]);
    expect(recordCalls).toEqual([{direction: "last", count: 3}]);
  });

  test("will load the first five items from a list", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadPrev(5)).toEqual([206, 207, 208, 209, 210]);
    expect(recordCalls).toEqual([{direction: "last", count: 5}]);
  });

  test("will load no items from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadPrev(0)).toEqual([]);
    expect(await cache.loadPrev(0)).toEqual([]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 0},
      {direction: "last", count: 0},
    ]);
  });

  test("will load the first item from a list many times", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadPrev(1)).toEqual([210]);
    expect(await cache.loadPrev(1)).toEqual([209, 210]);
    expect(await cache.loadPrev(1)).toEqual([208, 209, 210]);
    expect(await cache.loadPrev(1)).toEqual([207, 208, 209, 210]);
    expect(await cache.loadPrev(1)).toEqual([206, 207, 208, 209, 210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 1},
      {direction: "last", count: 1, before: 210},
      {direction: "last", count: 1, before: 209},
      {direction: "last", count: 1, before: 208},
      {direction: "last", count: 1, before: 207},
    ]);
  });

  test("will load the first two items from a list twice", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadPrev(2)).toEqual([209, 210]);
    expect(await cache.loadPrev(2)).toEqual([207, 208, 209, 210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 2},
      {direction: "last", count: 2, before: 209},
    ]);
  });

  test("will load the first item after loading some initial items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(2)).toEqual([209, 210]);
    expect(await cache.loadLast(2)).toEqual([209, 210]);
    expect(await cache.loadPrev(2)).toEqual([207, 208, 209, 210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 2},
      {direction: "last", count: 2, after: 210},
      {direction: "last", count: 2, before: 209},
    ]);
  });

  test("will load some new first items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [301, 302, 303];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(2)).toEqual([302, 303]);
    items.push(401, 402, 403);
    expect(await cache.loadLast(2)).toEqual([402, 403]);
    expect(await cache.loadPrev(2)).toEqual([302, 303, 401, 402, 403]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 2},
      {direction: "last", count: 2, after: 303},
      {direction: "last", count: 2, after: 303, before: 402},
    ]);
  });

  test("will ignore new items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(3)).toEqual([208, 209, 210]);
    items.push(301, 302, 303, 304, 305);
    expect(await cache.loadPrev(3)).toEqual([205, 206, 207, 208, 209, 210]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, before: 208},
    ]);
  });

  test("will NOT load until count has been filled", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [101, 102, 103];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadLast(2)).toEqual([102, 103]);
    items.push(104, 105, 106);
    expect(await cache.loadLast(2)).toEqual([105, 106]);
    items.push(107, 108, 109);
    expect(await cache.loadLast(2)).toEqual([108, 109]);
    expect(await cache.loadPrev(100)).toEqual([105, 106, 107, 108, 109]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 2},
      {direction: "last", count: 2, after: 103},
      {direction: "last", count: 2, after: 106},
      {direction: "last", count: 100, after: 106, before: 108},
    ]);
  });

  test("will meet in the middle with load first", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadPrev(5)).toEqual([206, 207, 208, 209, 210]);
    expect(await cache.loadFirst(5)).toEqual([201, 202, 203, 204, 205]);
    expect(await cache.loadPrev(1)).toEqual(items);
    expect(recordCalls).toEqual([
      {direction: "last", count: 5},
      {direction: "first", count: 5, before: 206},
      {direction: "last", count: 1, after: 205, before: 206},
    ]);
  });

  test("will load prev after load first", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    expect(await cache.loadPrev(3)).toEqual([201, 202, 203]);
    items.unshift(101, 102, 103, 104, 105);
    expect(await cache.loadPrev(3)).toEqual([103, 104, 105, 201, 202, 203]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "last", count: 3, before: 201},
      {direction: "last", count: 3, before: 201},
    ]);
  });

  test("will run twice in parallel successfully", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await Promise.all([cache.loadPrev(3), cache.loadPrev(3)])).toEqual([
      [208, 209, 210],
      [205, 206, 207, 208, 209, 210],
    ]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 3},
      {direction: "last", count: 3, before: 208},
    ]);
  });

  test("will run thrice in parallel successfully", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(
      await Promise.all([
        cache.loadPrev(2),
        cache.loadPrev(2),
        cache.loadPrev(2),
      ]),
    ).toEqual([
      [209, 210],
      [207, 208, 209, 210],
      [205, 206, 207, 208, 209, 210],
    ]);
    expect(recordCalls).toEqual([
      {direction: "last", count: 2},
      {direction: "last", count: 2, before: 209},
      {direction: "last", count: 2, before: 207},
    ]);
  });
});
