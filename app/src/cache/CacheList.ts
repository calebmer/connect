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
  private readonly segments: Mutable<Async<CacheListSegments<Item>>>;

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
    key,
    cursor,
    load,
  }: {
    key: (item: Item) => string | number;
    cursor: (item: Item) => ItemCursor;
    load: (range: Range<ItemCursor>) => Promise<ReadonlyArray<Item>>;
  }) {
    this._load = load;
    this._cursor = cursor;
    this.segments = new Mutable(new Async(CacheListSegments.empty(key)));
  }

  /**
   * Gets the cursor of a nullable item.
   */
  private getCursor(item: Item | null): ItemCursor | null {
    return item !== null ? this._cursor(item) : null;
  }

  /**
   * Loads the first `count` number of items into our cache. We always go to the
   * network to check for new items. Even if we have enough items in cache to
   * fulfill the request.
   *
   * We may return more items than `count` if we have cached items.
   *
   * We may return fewer items than `count` when there are indeed more items on
   * the server. We could keep loading more until we have `count` items (in a
   * previous version we did) but then this function would execute an unknown
   * number of API requests blocking any other requests to this resource.
   */
  public async loadFirst(count: number): Promise<ReadonlyArray<Item>> {
    // If the segments entry is pending then don’t update it! Instead let’s wait
    // for the segments entry to resolve and then we’ll try again.
    let segments = this.segments.getAtThisMomentInTime().get();
    while (segments instanceof Promise) {
      await segments;
      segments = this.segments.getAtThisMomentInTime().get();
    }

    const newSegmentsPromise = this._loadFirst(segments, count);
    this.segments.set(new Async(newSegmentsPromise));
    return (await newSegmentsPromise).getFirstSegment();
  }

  /**
   * The private implementation of `loadFirst()`.
   */
  private async _loadFirst(
    segments: CacheListSegments<Item>,
    count: number,
  ): Promise<CacheListSegments<Item>> {
    // Get the very first cursor in our cache. We only want to select items that
    // come before that cursor.
    const firstCursor = this.getCursor(segments.getFirstItem());

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
    if (newItems.length < count) {
      segments = segments.prependFirstSegment(newItems);
    } else {
      segments = segments.newFirstSegment(newItems);
    }

    return segments;
  }

  /**
   * Loads `count` more items from the _beginning_ of the cache list. This is
   * used to load more items as we are scrolling down through a cache list.
   *
   * Let’s say you called `loadFirst()` and then `loadLast()`. Calling
   * `loadNext()` will load more items after the items returned
   * by `loadFirst()`!
   *
   * We may return more items than `count` if we have cached items.
   *
   * We may return fewer items than `count` when there are indeed more items on
   * the server. We could keep loading more until we have `count` items (in a
   * previous version we did) but then this function would execute an unknown
   * number of API requests blocking any other requests to this resource.
   */
  public async loadNext(count: number): Promise<ReadonlyArray<Item>> {
    // If the segments entry is pending then don’t update it! Instead let’s wait
    // for the segments entry to resolve and then we’ll try again.
    let segments = this.segments.getAtThisMomentInTime().get();
    while (segments instanceof Promise) {
      await segments;
      segments = this.segments.getAtThisMomentInTime().get();
    }

    const newSegmentsPromise = this._loadNext(segments, count);
    this.segments.set(new Async(newSegmentsPromise));
    return (await newSegmentsPromise).getFirstSegment();
  }

  /**
   * The private implementation of `loadNext()`.
   */
  private async _loadNext(
    segments: CacheListSegments<Item>,
    count: number,
  ): Promise<CacheListSegments<Item>> {
    // Get the upper and lower bound for our fetch.
    const firstSegmentLastCursor = this.getCursor(
      segments.getFirstSegmentLastItem(),
    );
    const secondSegmentFirstCursor = this.getCursor(
      segments.getSecondSegmentFirstItem(),
    );

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
    if (newItems.length < count) {
      segments = segments.mergeFirstSegment(newItems);
    } else {
      segments = segments.appendFirstSegment(newItems);
    }

    return segments;
  }

  /**
   * Loads the last `count` number of items into our cache. We always go to the
   * network to check for new items. Even if we have enough items in cache to
   * fulfill the request.
   *
   * We may return more items than `count` if we have cached items.
   *
   * We may return fewer items than `count` when there are indeed more items on
   * the server. We could keep loading more until we have `count` items (in a
   * previous version we did) but then this function would execute an unknown
   * number of API requests blocking any other requests to this resource.
   */
  public async loadLast(count: number): Promise<ReadonlyArray<Item>> {
    // If the segments entry is pending then don’t update it! Instead let’s wait
    // for the segments entry to resolve and then we’ll try again.
    let segments = this.segments.getAtThisMomentInTime().get();
    while (segments instanceof Promise) {
      await segments;
      segments = this.segments.getAtThisMomentInTime().get();
    }

    const newSegmentsPromise = this._loadLast(segments, count);
    this.segments.set(new Async(newSegmentsPromise));
    return (await newSegmentsPromise).getLastSegment();
  }

  /**
   * The private implementation of `loadLast()`.
   */
  private async _loadLast(
    segments: CacheListSegments<Item>,
    count: number,
  ): Promise<CacheListSegments<Item>> {
    // Get the very last cursor in our cache. We only want to select items that
    // come after that cursor.
    const lastCursor = this.getCursor(segments.getLastItem());

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
    if (newItems.length < count) {
      segments = segments.appendLastSegment(newItems);
    } else {
      segments = segments.newLastSegment(newItems);
    }

    return segments;
  }

  /**
   * Loads `count` more items from the _end_ of the cache list. This is
   * used to load more items as we are scrolling up through a cache list.
   *
   * Let’s say you called `loadLast()` and then `loadFirst()`. Calling
   * `loadPrev()` will load more items after the items returned
   * by `loadLast()`!
   *
   * We may return more items than `count` if we have cached items.
   *
   * We may return fewer items than `count` when there are indeed more items on
   * the server. We could keep loading more until we have `count` items (in a
   * previous version we did) but then this function would execute an unknown
   * number of API requests blocking any other requests to this resource.
   */
  public async loadPrev(count: number): Promise<ReadonlyArray<Item>> {
    // If the segments entry is pending then don’t update it! Instead let’s wait
    // for the segments entry to resolve and then we’ll try again.
    let segments = this.segments.getAtThisMomentInTime().get();
    while (segments instanceof Promise) {
      await segments;
      segments = this.segments.getAtThisMomentInTime().get();
    }

    const newSegmentsPromise = this._loadPrev(segments, count);
    this.segments.set(new Async(newSegmentsPromise));
    return (await newSegmentsPromise).getLastSegment();
  }

  /**
   * The private implementation of `loadPrev()`.
   */
  private async _loadPrev(
    segments: CacheListSegments<Item>,
    count: number,
  ): Promise<CacheListSegments<Item>> {
    // Get the upper and lower bound for our fetch.
    const lastSegmentFirstCursor = this.getCursor(
      segments.getLastSegmentFirstItem(),
    );
    const secondToLastSegmentLastCursor = this.getCursor(
      segments.getSecondToLastSegmentLastItem(),
    );

    // Load our new items using the loader function.
    const newItems = await this._load({
      direction: RangeDirection.Last,
      count,
      after: secondToLastSegmentLastCursor,
      before: lastSegmentFirstCursor,
    });

    // If we got fewer items then we expected, then we know for sure that
    // there are no new items between the set we just fetched and the second
    // to last cached segment, so merge the last segment with our new items and
    // the second to last segment.
    if (newItems.length < count) {
      segments = segments.mergeLastSegment(newItems);
    } else {
      segments = segments.prependLastSegment(newItems);
    }

    return segments;
  }

  /**
   * Insert a phantom item into the beginning of our list. The phantom item will
   * be de-duplicated from server loaded items and will not be used as a cursor.
   *
   * This method is async in case there are any pending loads for this
   * cache list.
   */
  public async insertPhantomFirst(item: Item): Promise<void> {
    // If the segments entry is pending then don’t update it! Instead let’s wait
    // for the segments entry to resolve and then we’ll try again.
    let segments = this.segments.getAtThisMomentInTime().get();
    while (segments instanceof Promise) {
      await segments;
      segments = this.segments.getAtThisMomentInTime().get();
    }

    this.segments.set(new Async(segments.insertPhantomFirst(item)));
  }

  /**
   * Insert a phantom item into the end of our list. The phantom item will be
   * de-duplicated from server loaded items and will not be used as a cursor.
   *
   * This method is async in case there are any pending loads for this
   * cache list.
   */
  public async insertPhantomLast(item: Item): Promise<void> {
    // If the segments entry is pending then don’t update it! Instead let’s wait
    // for the segments entry to resolve and then we’ll try again.
    let segments = this.segments.getAtThisMomentInTime().get();
    while (segments instanceof Promise) {
      await segments;
      segments = this.segments.getAtThisMomentInTime().get();
    }

    this.segments.set(new Async(segments.insertPhantomLast(item)));
  }
}

/**
 * Uses the data from the first items in a cache list. Suspends if we are
 * loading items from the list. If we are loading items from the list but we
 * previously rendered with some items then we will render using the
 * previous items.
 */
export function useCacheList<ItemCursor extends Cursor<JSONValue>, Item>(
  cache: CacheList<ItemCursor, Item>,
): {
  loading: boolean;
  items: ReadonlyArray<Item>;
} {
  const cacheSegments: Mutable<Async<CacheListSegments<Item>>> = (cache as any)
    .segments;

  const asyncSegments = useMutable(cacheSegments);
  const {loading, value: segments} = useAsyncWithPrev(asyncSegments);

  return {
    loading,
    items: segments.getFirstSegment(),
  };
}

/**
 * The internal _immutable_ data structure of a `CacheList`. All the items in a
 * cache list are loaded incrementally from the server into “segments”. Segments
 * are chunks of items that are _known_ to be contiguous. There are no gaps
 * between the items in a segment. However, between any two segments there may
 * be more items. We don’t know until we try fetching from the server.
 *
 * **Phantom Items**
 *
 * Phantom items in the cache list are items that are added by our client and
 * not our server. For example, when the user posts a comment we add a “phantom”
 * comment to our cache list. The phantom comment will be de-duplicated if the
 * actual comment comes in from the server. Also, we realize that there may be
 * new items between the last batch of items was fetched and the time our
 * phantom item was inserted so we don’t ever use the cursor of a phantom item.
 *
 * Unless there is a segment of _only_ phantom items. Then we will use the
 * cursors of phantom items. Only because we need some notion of boundaries for
 * every segment. Eventually we’ll merge into the segment of only phantom items
 * and we’ll ignore the phantom items again.
 *
 * **Example**
 *
 * An example where this structure is useful. Say we have an infinite list UI.
 * We start by calling `CacheList.loadFirst(3)`. We now have three items.
 *
 * ┌──────────────────────────────┐
 * │ Segment 1 - Item 1           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 2           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 3           │
 * └──────────────────────────────┘
 *
 * The user scrolls to the bottom of our UI. Now we need to fetch more items!
 * So we call `CacheList.loadFirst(3)`. We now have six items.
 *
 * ┌──────────────────────────────┐
 * │ Segment 1 - Item 1           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 2           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 3           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 4           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 5           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 6           │
 * └──────────────────────────────┘
 *
 * Let’s say that during this time other users have been busy making new posts
 * or comments or whatever or list item is. Let’s say other users have added
 * _five_ new items to the top of the list. If our user keeps scrolling down
 * they won’t see the new items at the top of the list. But let’s say the user
 * pulls to refresh the list. Which is a common pattern on mobile. As a part
 * of the pull to refresh we call `CacheList.loadFirst(3)`. We now have nine
 * items in two segments:
 *
 * ┌──────────────────────────────┐
 * │ Segment 2 - Item 7           │
 * ├──────────────────────────────┤
 * │ Segment 2 - Item 8           │
 * ├──────────────────────────────┤
 * │ Segment 2 - Item 9           │
 * └──────────────────────────────┘
 * ┌──────────────────────────────┐
 * │ Segment 1 - Item 1           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 2           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 3           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 4           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 5           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 6           │
 * └──────────────────────────────┘
 *
 * We now only show the user Segment 2. The original segment they were scrolling
 * through, Segment 1, is hidden from view. In our implementation Segment 1 and
 * Segment 2 are separate because there might be more items in between them!
 * Indeed there are two more items (we said that our busy users added five new
 * items total). When the user scrolls to the bottom of Segment 2 in the
 * infinite list UI we’ll need to load more items so we call
 * `CacheList.loadNext(3)`. Now we have all the items.
 *
 * ┌──────────────────────────────┐
 * │ Segment 1 - Item 7           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 8           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 9           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 10          │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 11          │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 1           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 2           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 3           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 4           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 5           │
 * ├──────────────────────────────┤
 * │ Segment 1 - Item 6           │
 * └──────────────────────────────┘
 *
 * Note that we merged our segments together! We only have one segment since we
 * know that the user has caught up with their previous position.
 */
class CacheListSegments<Item> {
  /**
   * Creates an empty cache list.
   */
  public static empty<Item>(
    getKey: (item: Item) => string | number,
  ): CacheListSegments<Item> {
    return new CacheListSegments(getKey, new Set(), []);
  }

  /**
   * Function which will get a string or number key for an item.
   */
  private readonly getKey: (item: Item) => string | number;

  /**
   * The keys of items that are phantom items. We will use this set to
   * deduplicate repeated phantom items that we get from the server.
   */
  private readonly phantomKeys: ReadonlySet<string | number>;

  /**
   * All of our items grouped together by their segment.
   */
  private readonly segments: ReadonlyArray<NonEmptyArray<Item>>;

  private constructor(
    getKey: (item: Item) => string | number,
    phantomKeys: ReadonlySet<string | number>,
    segments: ReadonlyArray<NonEmptyArray<Item>>,
  ) {
    this.getKey = getKey;
    this.phantomKeys = phantomKeys;
    this.segments = segments;
  }

  /** Is this item a phantom item? */
  private isPhantomItem(item: Item): boolean {
    // TODO: When we receive a phantom item from the server, we can remove it
    // from `phantomKeys` since we can count its cursor now.
    //
    // TODO: This should also prevent infinite recursing in
    // `CacheList.loadFirst()` and friends when we don’t load enough.
    return this.phantomKeys.has(this.getKey(item));
  }

  /**
   * Gets the first segment in our cache list.
   */
  public getFirstSegment(): ReadonlyArray<Item> {
    if (this.segments.length > 0) {
      return this.segments[0];
    } else {
      return [];
    }
  }

  /**
   * Gets the last segment in our cache list.
   */
  public getLastSegment(): ReadonlyArray<Item> {
    if (this.segments.length > 0) {
      return this.segments[this.segments.length - 1];
    } else {
      return [];
    }
  }

  /**
   * Get the first non-phantom item in a segment. If there are only phantom
   * items in the segment then we return the first phantom item.
   */
  private getSegmentFirstItem(segment: NonEmptyArray<Item>): Item {
    for (let i = 0; i < segment.length; i++) {
      const item = segment[i];
      if (!this.isPhantomItem(item)) return item;
    }
    return segment[0];
  }

  /**
   * Get the first non-phantom item in a segment. If there are only phantom
   * items in the segment then we return the first phantom item.
   */
  private getSegmentLastItem(segment: NonEmptyArray<Item>): Item {
    for (let i = segment.length - 1; i >= 0; i--) {
      const item = segment[i];
      if (!this.isPhantomItem(item)) return item;
    }
    return segment[segment.length - 1];
  }

  /** Get the first item of the first segment. */
  public getFirstItem(): Item | null {
    if (this.segments.length < 1) return null;
    return this.getSegmentFirstItem(this.segments[0]);
  }

  /** Get the first item of the last segment. */
  public getFirstSegmentLastItem(): Item | null {
    if (this.segments.length < 1) return null;
    return this.getSegmentLastItem(this.segments[0]);
  }

  /** Get the first item of the second segment. */
  public getSecondSegmentFirstItem(): Item | null {
    if (this.segments.length < 2) return null;
    return this.getSegmentFirstItem(this.segments[1]);
  }

  /** Get the last item of the last segment. */
  public getLastItem(): Item | null {
    if (this.segments.length < 1) return null;
    return this.getSegmentLastItem(this.segments[this.segments.length - 1]);
  }

  /** Get the first item of the last segment. */
  public getLastSegmentFirstItem(): Item | null {
    if (this.segments.length < 1) return null;
    return this.getSegmentFirstItem(this.segments[this.segments.length - 1]);
  }

  /** Get the last item of the second to last segment. */
  public getSecondToLastSegmentLastItem(): Item | null {
    if (this.segments.length < 2) return null;
    return this.getSegmentLastItem(this.segments[this.segments.length - 2]);
  }

  /**
   * Creates a new segment with the items at the beginning of the list.
   */
  public newFirstSegment(
    rawNewItems: ReadonlyArray<Item>,
  ): CacheListSegments<Item> {
    const newSegment = rawNewItems.filter(item => !this.isPhantomItem(item));
    if (isNonEmpty(newSegment)) {
      return new CacheListSegments(this.getKey, this.phantomKeys, [
        newSegment,
        ...this.segments,
      ]);
    } else {
      return this;
    }
  }

  /**
   * Creates a new segment with the items at the end of the list.
   */
  public newLastSegment(
    rawNewItems: ReadonlyArray<Item>,
  ): CacheListSegments<Item> {
    const newSegment = rawNewItems.filter(item => !this.isPhantomItem(item));
    if (isNonEmpty(newSegment)) {
      return new CacheListSegments(this.getKey, this.phantomKeys, [
        ...this.segments,
        newSegment,
      ]);
    } else {
      return this;
    }
  }

  /**
   * Adds the items to the beginning of the first segment.
   */
  public prependFirstSegment(
    rawNewItems: ReadonlyArray<Item>,
  ): CacheListSegments<Item> {
    if (this.segments.length > 0) {
      const newSegment = [
        ...filterIterator(rawNewItems, item => !this.isPhantomItem(item)),
        ...this.segments[0],
      ] as NonEmptyArray<Item>;
      return new CacheListSegments(this.getKey, this.phantomKeys, [
        newSegment,
        ...this.segments.slice(1),
      ]);
    } else {
      return this.newFirstSegment(rawNewItems);
    }
  }

  /**
   * Adds the items to the beginning of the last segment.
   */
  public prependLastSegment(
    rawNewItems: ReadonlyArray<Item>,
  ): CacheListSegments<Item> {
    if (this.segments.length > 0) {
      const newSegment = [
        ...filterIterator(rawNewItems, item => !this.isPhantomItem(item)),
        ...this.segments[this.segments.length - 1],
      ] as NonEmptyArray<Item>;
      return new CacheListSegments(this.getKey, this.phantomKeys, [
        ...this.segments.slice(0, -1),
        newSegment,
      ]);
    } else {
      return this.newLastSegment(rawNewItems);
    }
  }

  /**
   * Adds the items to the end of the first segment.
   */
  public appendFirstSegment(
    rawNewItems: ReadonlyArray<Item>,
  ): CacheListSegments<Item> {
    if (this.segments.length > 0) {
      const newSegment = [
        ...this.segments[0],
        ...filterIterator(rawNewItems, item => !this.isPhantomItem(item)),
      ] as NonEmptyArray<Item>;
      return new CacheListSegments(this.getKey, this.phantomKeys, [
        newSegment,
        ...this.segments.slice(1),
      ]);
    } else {
      return this.newFirstSegment(rawNewItems);
    }
  }

  /**
   * Adds the items to the end of the last segment.
   */
  public appendLastSegment(
    rawNewItems: ReadonlyArray<Item>,
  ): CacheListSegments<Item> {
    if (this.segments.length > 0) {
      const newSegment = [
        ...this.segments[this.segments.length - 1],
        ...filterIterator(rawNewItems, item => !this.isPhantomItem(item)),
      ] as NonEmptyArray<Item>;
      return new CacheListSegments(this.getKey, this.phantomKeys, [
        ...this.segments.slice(0, -1),
        newSegment,
      ]);
    } else {
      return this.newLastSegment(rawNewItems);
    }
  }

  /**
   * Merges the first two segments into a single segment with the provided items
   * in between.
   */
  public mergeFirstSegment(
    rawNewItems: ReadonlyArray<Item>,
  ): CacheListSegments<Item> {
    if (this.segments.length > 1) {
      const newSegment = [
        ...this.segments[0],
        ...filterIterator(rawNewItems, item => !this.isPhantomItem(item)),
        ...this.segments[1],
      ] as NonEmptyArray<Item>;
      return new CacheListSegments(this.getKey, this.phantomKeys, [
        newSegment,
        ...this.segments.slice(2),
      ]);
    } else {
      return this.appendFirstSegment(rawNewItems);
    }
  }

  /**
   * Merges the last two segments into a single segment with the provided items
   * in between.
   */
  public mergeLastSegment(
    rawNewItems: ReadonlyArray<Item>,
  ): CacheListSegments<Item> {
    if (this.segments.length > 1) {
      const newSegment = [
        ...this.segments[this.segments.length - 2],
        ...filterIterator(rawNewItems, item => !this.isPhantomItem(item)),
        ...this.segments[this.segments.length - 1],
      ] as NonEmptyArray<Item>;
      return new CacheListSegments(this.getKey, this.phantomKeys, [
        ...this.segments.slice(0, -2),
        newSegment,
      ]);
    } else {
      return this.prependLastSegment(rawNewItems);
    }
  }

  /**
   * Inserts a phantom item into the beginning of the list. A phantom item will
   * not be used when deciding what cursor to use to fetch new items.
   *
   * If a later function adds a batch of items that contains the phantom item
   * then the phantom item will be de-duplicated.
   */
  public insertPhantomFirst(item: Item): CacheListSegments<Item> {
    if (this.segments.length > 0) {
      const firstSegment = [item, ...this.segments[0]];
      return new CacheListSegments(
        this.getKey,
        new Set(this.phantomKeys).add(this.getKey(item)),
        [firstSegment as NonEmptyArray<Item>, ...this.segments.slice(1)],
      );
    } else {
      return new CacheListSegments(
        this.getKey,
        new Set(this.phantomKeys).add(this.getKey(item)),
        [[item]],
      );
    }
  }

  /**
   * Inserts a phantom item into the end of the list. A phantom item will
   * not be used when deciding what cursor to use to fetch new items.
   *
   * If a later function adds a batch of items that contains the phantom item
   * then the phantom item will be de-duplicated.
   */
  public insertPhantomLast(item: Item): CacheListSegments<Item> {
    if (this.segments.length > 0) {
      const lastSegment = [...this.segments[this.segments.length - 1], item];
      return new CacheListSegments(
        this.getKey,
        new Set(this.phantomKeys).add(this.getKey(item)),
        [...this.segments.slice(0, -1), lastSegment as NonEmptyArray<Item>],
      );
    } else {
      return new CacheListSegments(
        this.getKey,
        new Set(this.phantomKeys).add(this.getKey(item)),
        [[item]],
      );
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
 * Utility for filtering an iterator. Makes some operations that would be O(2n)
 * with `Array.filter()` O(n) for whatever that’s worth.
 */
function filterIterator<Item>(
  iterable: Iterable<Item>,
  filter: (item: Item) => boolean,
): Iterable<Item> {
  return {
    [Symbol.iterator]: () => {
      const iterator = iterable[Symbol.iterator]();
      return {
        next: () => {
          // eslint-disable-next-line no-constant-condition
          while (true) {
            const result = iterator.next();
            if (result.done === true) {
              return result;
            } else if (filter(result.value)) {
              return result;
            }
          }
        },
      };
    },
  };
}
