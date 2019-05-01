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

    // We will compute the start and end of our load by “growing” a range of
    // unselected items that intersects with our current range. So initialize
    // both start and end to the same position.
    let start = requestedOffset;
    let end = start;

    // We will count this variable down to zero as we decide on the best range
    // to select.
    let remainingLimit = requestedLimit;

    // Increment our end pointer while there are empty items and we have some
    // limit to “spend”.
    const incrementEnd = () => {
      while (remainingLimit > 0) {
        if (end >= this.items.length) {
          // If there are no more items, we never select past the end of our
          // items list since there won’t be any items.
          if (!this.noMoreItems) {
            end += remainingLimit;
            remainingLimit = 0;
          }
          break;
        } else if (this.items[end] === empty) {
          end++;
          remainingLimit--;
        } else {
          break;
        }
      }
    };

    // Decrement our start pointer while there are empty items and we have some
    // limit to “spend”.
    const decrementStart = () => {
      while (remainingLimit > 0) {
        // NOTE: If `start` is outside of `this.items` then `end` **MUST** also
        // be outside of `this.items`. When `end` is outside of `this.items` it
        // is handled above and we exhaust `remainingLimit` by setting it to
        // zero so we don’t need to handle `start` being outside
        // `this.items` here.

        if (start <= 0) {
          break;
        } else if (!this.noMoreItems && start >= this.items.length) {
          start--;
          remainingLimit--;
        } else if (this.items[start] === empty) {
          start--;
          remainingLimit--;
        } else {
          break;
        }
      }
    };

    // Try growing our range by first trying to increment end by the requested
    // limit. With our remaining limit try decrementing start to capture more
    // items with the same limit.
    incrementEnd();
    decrementStart();

    // If we weren’t able to select any items then let’s try selecting new items
    // from the end of the range.
    if (start === end) {
      // Reset start and end to the end of the range.
      start = requestedOffset + requestedLimit;
      end = start;

      // Reset our remaining limit.
      remainingLimit = requestedLimit;

      // Start by trying to decrement start so that we reach back to our
      // original offset. With any remaining limit try incrementing end to
      // capture more items with the same limit.
      console.log({start, end});
      decrementStart();
      console.log({start, end});
      incrementEnd();
      console.log({start, end});
    }

    // If we still weren’t able to select any items then don’t load
    // anything. Yay!
    if (start === end) {
      return this;
    }

    // Compute the limit and offset we will use.
    const limit = end - start;
    const offset = start;

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
