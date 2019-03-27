import {Async, useAsyncWithPrev} from "./Async";
import {Cursor, JSONValue, Range, RangeDirection} from "@connect/api-client";
import {Mutable, useMutable} from "./Mutable";

/**
 * A cache for some list of items which will be lazily loaded from the server.
 * One can use the methods on the cache list to load more items from the server.
 *
 * The way the cache is designed, once an item goes _into_ the cached list it
 * never comes out. This means that the `CacheList` is only suitable for lists
 * which are append-only. However, we support append-only lists in
 * either direction.
 *
 * Instead of caching entire objects into the cache list, it’s recommend that
 * you only cache the ID of an object. Then use a second object `Cache` to hold
 * the full entity.
 */
export class CacheList<ItemCursor extends Cursor<JSONValue>, Item> {
  /**
   * All of the items in our cache. We load items from the server into our
   * cache incrementally from either end of the list. That means we could load
   * the _first_ 3 items and then load the _last_ 3 items into our cache. But
   * then we would have a gap in our cache between the first and last items.
   * This would be represented with a segments array of:
   *
   * ```ts
   * segments = [[1, 2, 3], [7, 8, 9]];
   * ```
   *
   * This format lets us know that there _may_ be more items between 3 and 7.
   */
  private readonly segments = new Mutable<Async<CacheListSegments<Item>>>(
    new Async([]),
  );

  /**
   * User provided function to load more items based on the provided range.
   */
  private readonly _load: (
    range: Range<ItemCursor>,
  ) => Promise<ReadonlyArray<Item>>;

  /**
   * User provided function to get a cursor from a cached item.
   */
  private readonly _cursor: (item: Item) => ItemCursor;

  constructor({
    cursor,
    load,
  }: {
    cursor: (item: Item) => ItemCursor;
    load: (range: Range<ItemCursor>) => Promise<ReadonlyArray<Item>>;
  }) {
    this._load = load;
    this._cursor = cursor;
  }

  /**
   * Loads the first `count` number of items into our cache. We always go to the
   * network to check for new items. Even if we have enough items in cache to
   * fulfill the request.
   *
   * We may return more items then `count` if we have cached items.
   */
  public async loadFirst(count: number): Promise<ReadonlyArray<Item>> {
    // If the segments entry is pending then don’t update it! Instead let’s wait
    // for the segments entry to resolve and then we’ll try again.
    let segments = this.segments.get().get();
    while (segments instanceof Promise) {
      await segments;
      segments = this.segments.get().get();
    }

    const newSegmentsPromise = this._loadFirst(segments, count);
    this.segments.set(new Async(newSegmentsPromise));
    return (await newSegmentsPromise)[0] || [];
  }

  /**
   * The private implementation of `loadFirst()`.
   */
  private async _loadFirst(
    segments: CacheListSegments<Item>,
    count: number,
  ): Promise<CacheListSegments<Item>> {
    let maybeLoadMore = false;

    // Get the very first cursor in our cache. We only want to select items that
    // come before that cursor.
    const firstCursor =
      segments.length > 0 ? this._cursor(segments[0][0]) : null;

    // Load our new items using the loader function.
    const newItems = await this._load({
      direction: RangeDirection.First,
      count,
      after: null,
      before: firstCursor,
    });

    // If we got fewer items then we expected, then we know for sure that
    // there are no new items between the set we just fetched and the first
    // cached segment, so merge the new items into our first segment.
    if (newItems.length < count && segments.length > 0) {
      maybeLoadMore = true;
      if (newItems.length > 0) {
        segments = [
          [...newItems, ...segments[0]] as NonEmptyArray<Item>,
          ...segments.slice(1),
        ];
      }
    } else if (isNonEmpty(newItems)) {
      // We first check to make sure that `newItems` is non-empty.
      segments = [newItems, ...segments];
    }

    // If we loaded less then `count` items (probably because our cached
    // first-segment was too small) then load some more items to fill out
    // our cache.
    const firstSegment = segments[0] || [];
    if (maybeLoadMore && firstSegment.length < count) {
      return this._loadNext(segments, count - firstSegment.length);
    } else {
      return segments;
    }
  }

  /**
   * Loads `count` more items from the _beginning_ of the cache list. This is
   * used to load more items as we are scrolling down through a cache list.
   *
   * Let’s say you called `loadFirst()` and then `loadLast()`. Calling
   * `loadNext()` will load more items after the items returned
   * by `loadFirst()`!
   *
   * We may return more extra items then `count` if we have cached items.
   */
  public async loadNext(count: number): Promise<ReadonlyArray<Item>> {
    // If the segments entry is pending then don’t update it! Instead let’s wait
    // for the segments entry to resolve and then we’ll try again.
    let segments = this.segments.get().get();
    while (segments instanceof Promise) {
      await segments;
      segments = this.segments.get().get();
    }

    const newSegmentsPromise = this._loadNext(segments, count);
    this.segments.set(new Async(newSegmentsPromise));
    return (await newSegmentsPromise)[0] || [];
  }

  /**
   * The private implementation of `loadNext()`.
   */
  private async _loadNext(
    segments: CacheListSegments<Item>,
    count: number,
  ): Promise<CacheListSegments<Item>> {
    let maybeLoadMore = false;
    const expectedCount =
      (segments.length > 0 ? segments[0].length : 0) + count;

    // Get the upper and lower bound for our fetch.
    const firstSegmentLastCursor =
      segments.length > 0 ? this._cursor(last(segments[0])!) : null;
    const secondSegmentFirstCursor =
      segments.length > 1 ? this._cursor(segments[1][0]) : null;

    // Load our new items using the loader function.
    const newItems = await this._load({
      direction: RangeDirection.First,
      count,
      after: firstSegmentLastCursor,
      before: secondSegmentFirstCursor,
    });

    // If we got fewer items then we expected, then we know for sure that
    // there are no new items between the set we just fetched and the second
    // cached segment, so merge the first segment with our new items and the
    // second segment.
    if (newItems.length < count && segments.length > 1) {
      maybeLoadMore = true;
      segments = [
        [...segments[0], ...newItems, ...segments[1]] as NonEmptyArray<Item>,
        ...segments.slice(2),
      ];
    } else if (isNonEmpty(newItems)) {
      // Add our new items to the first segment. Otherwise, create the first
      // segment with our new items.
      if (segments.length > 0) {
        segments = [
          [...segments[0], ...newItems] as NonEmptyArray<Item>,
          ...segments.slice(1),
        ];
      } else {
        segments = [newItems, ...segments];
      }
    }

    // Get the first segment. We may not have a first segment so in that case
    // the first segment is an empty array.
    const firstSegment = segments[0] || [];
    if (maybeLoadMore && firstSegment.length < expectedCount) {
      return this._loadNext(segments, expectedCount - firstSegment.length);
    } else {
      return segments;
    }
  }

  /**
   * Loads the last `count` number of items into our cache. We always go to the
   * network to check for new items. Even if we have enough items in cache to
   * fulfill the request.
   *
   * We may return more items then `count` if we have cached items.
   */
  public async loadLast(count: number): Promise<ReadonlyArray<Item>> {
    // If the segments entry is pending then don’t update it! Instead let’s wait
    // for the segments entry to resolve and then we’ll try again.
    let segments = this.segments.get().get();
    while (segments instanceof Promise) {
      await segments;
      segments = this.segments.get().get();
    }

    const newSegmentsPromise = this._loadLast(segments, count);
    this.segments.set(new Async(newSegmentsPromise));
    return last(await newSegmentsPromise) || [];
  }

  /**
   * The private implementation of `loadLast()`.
   */
  private async _loadLast(
    segments: CacheListSegments<Item>,
    count: number,
  ): Promise<CacheListSegments<Item>> {
    let maybeLoadMore = false;

    // Get the very last cursor in our cache. We only want to select items that
    // come after that cursor.
    const lastCursor =
      segments.length > 0 ? this._cursor(last(last(segments)!)) : null;

    // Load our new items using the loader function.
    const newItems = await this._load({
      direction: RangeDirection.Last,
      count,
      after: lastCursor,
      before: null,
    });

    // If we got fewer items then we expected, then we know for sure that
    // there are no new items between the set we just fetched and the last
    // cached segment, so merge the new items into our last segment.
    if (newItems.length < count && segments.length > 0) {
      maybeLoadMore = true;
      if (newItems.length > 0) {
        segments = [
          ...segments.slice(0, -1),
          [...last(segments), ...newItems] as NonEmptyArray<Item>,
        ];
      }
    } else if (isNonEmpty(newItems)) {
      // We check to make sure that `newItems` is non-empty.
      segments = [...segments, newItems];
    }

    // If we loaded less then `count` items (probably because our cached
    // last-segment was too small) then load some more items to fill out
    // our cache.
    const lastSegment = last(segments) || [];
    if (maybeLoadMore && lastSegment.length < count) {
      return this._loadPrev(segments, count - lastSegment.length);
    } else {
      return segments;
    }
  }

  /**
   * Loads `count` more items from the _end_ of the cache list. This is
   * used to load more items as we are scrolling up through a cache list.
   *
   * Let’s say you called `loadLast()` and then `loadFirst()`. Calling
   * `loadPrev()` will load more items after the items returned
   * by `loadLast()`!
   *
   * We may return more extra items then `count` if we have cached items.
   */
  async loadPrev(count: number): Promise<ReadonlyArray<Item>> {
    // If the segments entry is pending then don’t update it! Instead let’s wait
    // for the segments entry to resolve and then we’ll try again.
    let segments = this.segments.get().get();
    while (segments instanceof Promise) {
      await segments;
      segments = this.segments.get().get();
    }

    const newSegmentsPromise = this._loadPrev(segments, count);
    this.segments.set(new Async(newSegmentsPromise));
    return last(await newSegmentsPromise) || [];
  }

  /**
   * The private implementation of `loadPrev()`.
   */
  private async _loadPrev(
    segments: CacheListSegments<Item>,
    count: number,
  ): Promise<CacheListSegments<Item>> {
    let maybeLoadMore = false;
    const expectedCount =
      (segments.length > 0 ? last(segments)!.length : 0) + count;

    // Get the upper and lower bound for our fetch.
    const lastSegmentFirstCursor =
      segments.length > 0 ? this._cursor(last(segments)[0]) : null;
    const secondSegmentLastCursor =
      segments.length > 1
        ? this._cursor(last(segments[segments.length - 2]))
        : null;

    // Load our new items using the loader function.
    const newItems = await this._load({
      direction: RangeDirection.Last,
      count,
      after: secondSegmentLastCursor,
      before: lastSegmentFirstCursor,
    });

    // If we got fewer items then we expected, then we know for sure that
    // there are no new items between the set we just fetched and the second
    // to last cached segment, so merge the last segment with our new items and
    // the second to last segment.
    if (newItems.length < count && segments.length > 1) {
      maybeLoadMore = true;
      segments = [
        ...segments.slice(0, -2),
        [
          ...segments[segments.length - 2],
          ...newItems,
          ...segments[segments.length - 1],
        ] as NonEmptyArray<Item>,
      ];
    } else if (isNonEmpty(newItems)) {
      // Add our new items to the last segment. Otherwise, create the last
      // segment with our new items.
      if (segments.length > 0) {
        segments = [
          ...segments.slice(0, -1),
          [...newItems, ...last(segments)] as NonEmptyArray<Item>,
        ];
      } else {
        segments = [...segments, newItems];
      }
    }

    // Get the first segment. We may not have a first segment so in that case
    // the first segment is an empty array.
    const lastSegment = last(segments) || [];
    if (maybeLoadMore && lastSegment.length < expectedCount) {
      return this._loadPrev(segments, expectedCount - lastSegment.length);
    } else {
      return segments;
    }
  }
}

/**
 * The segments data structure for our cache list.
 */
type CacheListSegments<Item> = ReadonlyArray<NonEmptyArray<Item>>;

/**
 * A utility type for representing an array that is not empty.
 */
type NonEmptyArray<Item> = [Item, ...Array<Item>];

/**
 * Checks to see if an array is non-empty.
 */
function isNonEmpty<Item>(
  array: ReadonlyArray<Item>,
): array is NonEmptyArray<Item> {
  return array.length > 0;
}

/**
 * Small utility to get the last item in a non-empty array.
 */
function last<Item>(array: NonEmptyArray<Item>): Item;
function last<Item>(array: ReadonlyArray<Item>): Item;
function last<Item>(array: ReadonlyArray<Item>): Item | undefined {
  return array[array.length - 1];
}

/**
 * Uses the data from the first items in a cache list. Suspends if we are
 * loading items from the list. If we are loading items from the list but we
 * previously rendered with some items then we will render using the
 * previous items.
 */
export function useCacheListData<ItemCursor extends Cursor<JSONValue>, Item>(
  cache: CacheList<ItemCursor, Item>,
): {
  loading: boolean;
  items: Array<Item>;
} {
  const cacheSegments: Mutable<Async<CacheListSegments<Item>>> = (cache as any)
    .segments;

  const asyncSegments = useMutable(cacheSegments);
  const {loading, value: segments} = useAsyncWithPrev(asyncSegments);

  return {
    loading,
    items: segments[0] || [],
  };
}
