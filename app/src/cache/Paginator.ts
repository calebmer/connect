import {Cursor, JSONValue, Range, RangeDirection} from "@connect/api-client";

/**
 * A simple, immutable, utility class for controlling a progressively loaded
 * infinite list UI.
 *
 * In a paginator, we assume that the first item we fetch is _absolutely_ the
 * first item in the list. We also assume that the last item we fetch is
 * _absolutely_ the last item in the list. Use realtime updates if the list may
 * grow after we fetch it.
 */
export class Paginator<ItemCursor extends Cursor<JSONValue>, Item> {
  /**
   * Loads the initial items in an infinite list.
   */
  public static load<ItemCursor extends Cursor<JSONValue>, Item>({
    direction,
    count,
    cursor,
    load,
  }: {
    direction: RangeDirection;
    count: number;
    cursor: (item: Item) => ItemCursor;
    load: (range: Range<ItemCursor>) => Promise<ReadonlyArray<Item>>;
  }): Promise<Paginator<ItemCursor, Item>> {
    const list = new Paginator<ItemCursor, Item>(
      direction,
      cursor,
      load,
      [],
      false,
    );

    return list.loadMore(count);
  }

  private constructor(
    /**
     * What direction are we loading items in? If “first” then we start by
     * loading the first items in the list and progressively loading the last
     * items with `loadMore()`. If “last” then we start by loading the last
     * items in the list and progressively loading the first items
     * with `loadMore()`.
     */
    private readonly direction: RangeDirection,

    /**
     * User-provided function to get a cursor from an individual item in
     * the list.
     */
    private readonly getCursor: (item: Item) => ItemCursor,

    /**
     * User-provided fetcher to load more items in a given range from the API.
     */
    private readonly fetchMore: (
      range: Range<ItemCursor>,
    ) => Promise<ReadonlyArray<Item>>,

    /**
     * All of the items in our list. As we progressively load more items we will
     * immutably update this list. Currently, we immutably update the list
     * through cloning it.
     */
    public readonly items: ReadonlyArray<Item>,

    /**
     * When we’ve reached the end of our list we flip this to true. After that,
     * calling `loadMore()` has no effect.
     */
    public readonly noMoreItems: boolean,
  ) {}

  /**
   * Loads more items in the list based on the direction of the list.
   */
  public async loadMore(count: number): Promise<Paginator<ItemCursor, Item>> {
    // If there are no more items then don’t fetch anything else!
    if (this.noMoreItems) return this;

    // Get the range based on the direction of our list.
    let range: Range<ItemCursor>;
    if (this.direction === RangeDirection.First) {
      range = {
        direction: RangeDirection.First,
        count,
        after:
          this.items.length > 0
            ? this.getCursor(this.items[this.items.length - 1])
            : null,
        before: null,
      };
    } else {
      range = {
        direction: RangeDirection.Last,
        count,
        after: null,
        before: this.items.length > 0 ? this.getCursor(this.items[0]) : null,
      };
    }

    // Actually go and fetch more items!
    const newItems = await this.fetchMore(range);

    // If we got fewer items then we requested, that means we’ve reached the
    // end of our list.
    const noMoreItems = newItems.length < count;

    // Add our items to either the beginning or end of the list depending on
    // our direction.
    const items =
      this.direction === RangeDirection.First
        ? this.items.concat(newItems)
        : newItems.concat(this.items);

    // Construct our new infinite list and return it.
    return new Paginator(
      this.direction,
      this.getCursor,
      this.fetchMore,
      items,
      noMoreItems,
    );
  }

  /**
   * Manually insert an item into our infinite list. We will insert it at the
   * opposite end of pagination.
   */
  public insert(newItem: Item): Paginator<ItemCursor, Item> {
    return new Paginator(
      this.direction,
      this.getCursor,
      this.fetchMore,
      this.direction === RangeDirection.First
        ? [newItem, ...this.items]
        : [...this.items, newItem],
      this.noMoreItems,
    );
  }
}
