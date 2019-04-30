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
    return new Skimmer(load, []);
  }

  /**
   * The function used to fetch more data from our API using a limit/offset
   * pagination scheme.
   */
  private readonly fetchMore: (range: {
    limit: number;
    offset: number;
  }) => Promise<ReadonlyArray<Item>>;

  /**
   * The current items in our skimmer.
   */
  public readonly items: ReadonlyArray<Item | typeof empty>;

  private constructor(
    fetchMore: (range: {
      limit: number;
      offset: number;
    }) => Promise<ReadonlyArray<Item>>,
    items: ReadonlyArray<Item | typeof empty>,
  ) {
    this.fetchMore = fetchMore;
    this.items = items;
  }

  /**
   * Load some new items into our list using the offset and limit of
   * those items.
   */
  public async load({
    limit: originalLimit,
    offset: originalOffset,
  }: {
    limit: number;
    offset: number;
  }) {
    // Don‘t allow limit and offset to be negative numbers.
    originalLimit = Math.max(originalLimit, 0);
    originalOffset = Math.max(originalOffset, 0);

    // The maximum possible end position for our load.
    const maxEnd = originalOffset + originalLimit;

    // Find the first offset where we have not yet loaded data. The end of our
    // list is always not yet loaded.
    let start = originalOffset;
    while (
      start < maxEnd &&
      start < this.items.length &&
      this.items[start] !== empty
    ) {
      start++;
    }

    // We only want to fetch items that are not yet loaded. Stop when we see the
    // first loaded item.
    //
    // TODO: If we have a list that looks like
    // `[null, null, C, D, E, null, null]` and try to load with offset 0 and
    // limit 7 (the entire list) we will only load `[A, B, C, D, E, null, null]`
    // leaving the end of the list unloaded. Shouldn’t matter in practice since
    // we don’t use the list in this way. Still a bug, though. We should run
    // two fetches in parallel.
    let end = start;
    while (
      end < maxEnd &&
      end < this.items.length &&
      this.items[end] === empty
    ) {
      end++;
    }

    // If we reached the end of the list then always use our max ending.
    if (end >= this.items.length) {
      end = maxEnd;
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

    // Return our updated list.
    return new Skimmer(this.fetchMore, items);
  }
}
