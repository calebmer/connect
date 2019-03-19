import {Cursor, JSONValue} from "@connect/api-client";
import {CacheList} from "./CacheList";
import {useRef} from "react";

/**
 * Uses the data from the first items in a cache list. Suspends if we are
 * loading items from the list. If we are loading items from the list but we
 * previously rendered with some items then we will render using the
 * previous items.
 */
export function useCacheListData<ItemCursor extends Cursor<JSONValue>, Item>(
  cache: CacheList<ItemCursor, Item>,
): {
  readonly loading: boolean;
  readonly items: ReadonlyArray<Item>;
} {
  const previousItems = useRef<ReadonlyArray<Item> | null>(null);
  try {
    const items = cache.suspendFirst();
    previousItems.current = items;
    return {loading: false, items};
  } catch (error) {
    if (error instanceof Promise && previousItems.current !== null) {
      return {loading: true, items: previousItems.current};
    } else {
      throw error;
    }
  }
}
