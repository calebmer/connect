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
   *
   * If we already have items in the requested offset and limit then we will
   * modify our range to select items we don’t have yet.
   *
   * We keep the limit the same while we move around the offset to fetch items
   * we don’t have yet. That way we don’t have wasteful fetches for only one new
   * item at a time.
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

    let start = requestedOffset;
    let end = start;

    let remainingLimit = requestedLimit;

    while (remainingLimit > 0) {
      if (end >= this.items.length) {
        end += remainingLimit;
        remainingLimit = 0;
        break;
      } else if (this.items[end] === empty) {
        end++;
        remainingLimit--;
      } else {
        break;
      }
    }

    while (remainingLimit > 0) {
      // NOTE: If `start` is outside of `this.items` then `end` **MUST** also be
      // outside of `this.items`. When `end` is outside of `this.items` it is
      // handled above and we exhaust `remainingLimit` by setting it to zero so
      // we don’t need to handle `start` being outside `this.items` here.

      if (start <= 0) {
        remainingLimit = 0;
        break;
      } else if (this.items[start - 1] === empty) {
        start--;
        remainingLimit--;
      } else {
        break;
      }
    }

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
