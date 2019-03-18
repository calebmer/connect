import {Cursor, JSONValue, Range, RangeDirection} from "@connect/api-client";

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
   * All of the items in our cache. We load items from the server into our cache
   * incrementally from either end of the list. That means we could load the
   * _first_ 3 items and then load the _last_ 3 items into our cache. But then
   * we would have a gap in our cache between the first and last items. This
   * would be represented with a segments array of:
   *
   * ```ts
   * segments = [[1, 2, 3], [7, 8, 9]];
   * ```
   *
   * This format lets us know that there _may_ be more items between 3 and 7.
   */
  private segments: ReadonlyArray<NonEmptyArray<Item>> = [];

  /**
   * User provided function to load more items based on the provided range.
   */
  private _load: (range: Range<ItemCursor>) => Promise<ReadonlyArray<Item>>;

  /**
   * User provided function to get a cursor from a cached item.
   */
  private _cursor: (item: Item) => ItemCursor;

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
  async loadFirst(count: number): Promise<ReadonlyArray<Item>> {
    let maybeLoadMore = false;

    // Get the very first cursor in our cache. We only want to select items that
    // come before that cursor.
    const firstCursor =
      this.segments.length > 0 ? this._cursor(this.segments[0][0]) : null;

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
    if (newItems.length < count && this.segments.length > 0) {
      maybeLoadMore = true;
      if (newItems.length > 0) {
        this.segments = [
          [...newItems, ...this.segments[0]] as NonEmptyArray<Item>,
          ...this.segments.slice(1),
        ];
      }
    } else if (isNonEmpty(newItems)) {
      // We check to make sure that `newItems` is non-empty.
      this.segments = [newItems, ...this.segments];
    }

    // If we loaded less then `count` items (probably because our cached
    // first-segment was too small) then load some more items to fill out
    // our cache.
    const firstSegment = this.segments[0] || [];
    if (maybeLoadMore && firstSegment.length < count) {
      return this.loadNext(count - firstSegment.length);
    } else {
      return firstSegment;
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
  async loadNext(count: number): Promise<ReadonlyArray<Item>> {
    let maybeLoadMore = false;
    const initialCount = this.segments.length > 0 ? this.segments[0].length : 0;

    // Get the upper and lower bound for our fetch.
    const firstSegmentLastCursor =
      this.segments.length > 0 ? this._cursor(last(this.segments[0])!) : null;
    const secondSegmentFirstCursor =
      this.segments.length > 1 ? this._cursor(this.segments[1][0]) : null;

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
    if (newItems.length < count && this.segments.length > 1) {
      maybeLoadMore = true;
      this.segments = [
        [
          ...this.segments[0],
          ...newItems,
          ...this.segments[1],
        ] as NonEmptyArray<Item>,
        ...this.segments.slice(2),
      ];
    } else if (isNonEmpty(newItems)) {
      // Add our new items to the first segment. Otherwise, create the first
      // segment with our new items.
      if (this.segments.length > 0) {
        this.segments = [
          [...this.segments[0], ...newItems] as NonEmptyArray<Item>,
          ...this.segments.slice(1),
        ];
      } else {
        this.segments = [newItems, ...this.segments];
      }
    }

    // Get the first segment. We may not have a first segment so in that case
    // the first segment is an empty array.
    const firstSegment = this.segments[0] || [];
    if (maybeLoadMore && firstSegment.length < initialCount + count) {
      return this.loadNext(initialCount + count - firstSegment.length);
    } else {
      return firstSegment;
    }
  }

  /**
   * Loads the last `count` number of items into our cache. We always go to the
   * network to check for new items. Even if we have enough items in cache to
   * fulfill the request.
   *
   * We may return more items then `count` if we have cached items.
   */
  async loadLast(count: number): Promise<ReadonlyArray<Item>> {
    let maybeLoadMore = false;

    // Get the very last cursor in our cache. We only want to select items that
    // come after that cursor.
    const lastCursor =
      this.segments.length > 0
        ? this._cursor(last(last(this.segments)!))
        : null;

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
    if (newItems.length < count && this.segments.length > 0) {
      maybeLoadMore = true;
      if (newItems.length > 0) {
        this.segments = [
          ...this.segments.slice(0, -1),
          [...last(this.segments), ...newItems] as NonEmptyArray<Item>,
        ];
      }
    } else if (isNonEmpty(newItems)) {
      // We check to make sure that `newItems` is non-empty.
      this.segments = [...this.segments, newItems];
    }

    // If we loaded less then `count` items (probably because our cached
    // last-segment was too small) then load some more items to fill out
    // our cache.
    const lastSegment = last(this.segments) || [];
    if (maybeLoadMore && lastSegment.length < count) {
      return this.loadPrev(count - lastSegment.length);
    } else {
      return lastSegment;
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
    let maybeLoadMore = false;
    const initialCount =
      this.segments.length > 0 ? last(this.segments)!.length : 0;

    // Get the upper and lower bound for our fetch.
    const lastSegmentFirstCursor =
      this.segments.length > 0 ? this._cursor(last(this.segments)[0]) : null;
    const secondSegmentLastCursor =
      this.segments.length > 1
        ? this._cursor(last(this.segments[this.segments.length - 2]))
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
    if (newItems.length < count && this.segments.length > 1) {
      maybeLoadMore = true;
      this.segments = [
        ...this.segments.slice(0, -2),
        [
          ...this.segments[this.segments.length - 2],
          ...newItems,
          ...this.segments[this.segments.length - 1],
        ] as NonEmptyArray<Item>,
      ];
    } else if (isNonEmpty(newItems)) {
      // Add our new items to the last segment. Otherwise, create the last
      // segment with our new items.
      if (this.segments.length > 0) {
        this.segments = [
          ...this.segments.slice(0, -1),
          [...newItems, ...last(this.segments)] as NonEmptyArray<Item>,
        ];
      } else {
        this.segments = [...this.segments, newItems];
      }
    }

    // Get the first segment. We may not have a first segment so in that case
    // the first segment is an empty array.
    const lastSegment = last(this.segments) || [];
    if (maybeLoadMore && lastSegment.length < initialCount + count) {
      return this.loadPrev(initialCount + count - lastSegment.length);
    } else {
      return lastSegment;
    }
  }
}

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
