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
        for (let i = allItems.length; i >= 0; i--) {
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

  test("will load three items then five items", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [201, 202, 203, 204, 205, 206, 207, 208, 209, 210];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(3)).toEqual([201, 202, 203]);
    expect(await cache.loadFirst(5)).toEqual([201, 202, 203, 204, 205]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 3},
      {direction: "first", count: 5, before: 201},
      {direction: "first", count: 2, after: 203},
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

  test("will load until count has been filled", async () => {
    const recordCalls: Array<TestRange> = [];
    const items = [107, 108, 109];
    const cache = testCacheList(items, recordCalls);
    expect(await cache.loadFirst(2)).toEqual([107, 108]);
    items.unshift(104, 105, 106);
    expect(await cache.loadFirst(2)).toEqual([104, 105]);
    items.unshift(101, 102, 103);
    expect(await cache.loadFirst(2)).toEqual([101, 102]);
    expect(await cache.loadNext(100)).toEqual([
      101,
      102,
      103,
      104,
      105,
      106,
      107,
      108,
      109,
    ]);
    expect(recordCalls).toEqual([
      {direction: "first", count: 2},
      {direction: "first", count: 2, before: 107},
      {direction: "first", count: 2, before: 104},
      {direction: "first", count: 100, after: 102, before: 104},
      {direction: "first", count: 97, after: 105, before: 107},
      {direction: "first", count: 94, after: 108},
    ]);
  });
});
