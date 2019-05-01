/**
 * We use this symbol when we have a “gap” in our skim list. When there is an
 * item that is not yet loaded.
 *
 * We use a symbol instead of `null` since it is truthy.
 */
export const empty = Symbol("Skimmer.empty");

/**
 * An immutable utility class for creating an infinite list which can be
 * randomly accessed at any part of the list. An infinite list which can be
 * “skimmed”. Unlike `Paginator` which always loads from the end.
 *
 * Uses limit/offset pagination to randomly access any point in the list. We
 * assume that no items will ever be added to the front of the list. Otherwise
 * this pagination scheme would break!
 *
 * We assume that the order of items in the list never changes and we only ever
 * add items to the end of the list.
 */
export class Skimmer<Item> {
  /**
   * Creates a new skim list.
   */
  public static create<Item>({
    load,
  }: {
    load: (range: {
      limit: number;
      offset: number;
    }) => Promise<ReadonlyArray<Item>>;
  }) {
    return new Skimmer(load, [], false);
  }

  private constructor(
    /**
     * The function used to fetch more data from our API using a limit/offset
     * pagination scheme.
     */
    private readonly fetchMore: (range: {
      limit: number;
      offset: number;
    }) => Promise<ReadonlyArray<Item>>,

    /**
     * The current items in our skimmer.
     */
    public readonly items: ReadonlyArray<Item | typeof empty>,

    /**
     * If we have fetched all the items in this list then we set this flag
     * to true.
     */
    private readonly noMoreItems: boolean,
  ) {
    this.fetchMore = fetchMore;
    this.items = items;
    this.noMoreItems = noMoreItems;
  }

  /**
   * Load some new items into our list using the offset and limit of
   * those items.
   *
   * Tries to always load the requested “limit” number of items. Even if that
   * means loading some items outside of the declared range. If the entire range
   * has already been loaded then this method will not make an API request. We
   * will only expand the range if there are some overlapping unloaded items.
   */
  public async load({
    limit: requestedLimit,
    offset: requestedOffset,
  }: {
    limit: number;
    offset: number;
  }) {
    // Don‘t allow limit and offset to be negative numbers.
    requestedLimit = Math.max(requestedLimit, 0);
    requestedOffset = Math.max(requestedOffset, 0);

    // The maximum possible start position for our load. If we’ve reached the
    // end of our list then we won’t load beyond our items list.
    let maxStart = requestedOffset + requestedLimit;
    if (this.noMoreItems) {
      maxStart = Math.min(maxStart, this.items.length);
    }

    // Find the first offset where we have not yet loaded data. The end of our
    // list is always not yet loaded so stop incrementing our start
    // cursor there.
    let start = requestedOffset;
    while (
      start < maxStart - 1 &&
      start < this.items.length &&
      this.items[start] !== empty
    ) {
      start++;
    }

    // Move our end cursor so that we are covering the same number of items as
    // requested by our limit. Unless we find a non-empty item then we’ll stop
    // incrementing our end cursor to avoid re-fetching.
    //
    // TODO: If we have a list that looks like
    // `[null, null, C, D, E, null, null]` and try to load with offset 0 and
    // limit 7 (the entire list) we will only load `[A, B, C, D, E, null, null]`
    // leaving the end of the list unloaded. Shouldn’t matter in practice since
    // we don’t use the list in this way. Still a bug, though. We should run
    // two fetches in parallel.
    let end = start;
    while (
      end - start < requestedLimit &&
      (end >= this.items.length || this.items[end] === empty)
    ) {
      end++;
    }

    // If the start cursor is currently pointing at an empty item and our range
    // covers fewer items then the requested limit, try moving our cursor back
    // to the previous empty item to try and fill our limit.
    if (this.items[start] === empty) {
      while (
        end - start < requestedLimit &&
        start > 0 &&
        this.items[start - 1] === empty
      ) {
        start--;
      }
    }

    // Compute the actual offset and limit.
    const limit = end - start;
    const offset = start;

    // If limit is zero then that means we are fetching no items. So don’t
    // bother making an API request.
    if (limit === 0) {
      return this;
    }

    // Fetch more items from the API!
    const newItems = await this.fetchMore({limit, offset});

    // Clone our items array.
    const items = this.items.slice();

    // If the items array is missing items before our offset then fill our array
    // with nulls.
    while (items.length < offset) {
      items.push(empty);
    }

    // Add our new items to the list.
    for (let i = 0; i < newItems.length; i++) {
      items[offset + i] = newItems[i];
    }

    // There are no more items if we fetched less than expected when our range
    // exceeds the current number of items.
    const noMoreItems =
      this.noMoreItems ||
      (offset + limit > this.items.length && newItems.length < limit);

    // Return our updated list.
    return new Skimmer(this.fetchMore, items, noMoreItems);
  }
}
