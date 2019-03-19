import {Box, useBox} from "./Box";
import {Async} from "./Async";

/**
 * Responsible for caching data.
 */
export class Cache<Key extends string | number, Data> {
  /**
   * Function for loading a new cache entry.
   */
  private readonly _load: (key: Key) => Promise<Data>;

  /**
   * All the currently cached entries.
   *
   * **TODO:** Currently, the cache is unbounded. It will keep growing and
   * growing! We should add a way to garbage collect unused entries. Maybe
   * an [LRU cache algorithm][1]?
   *
   * **TODO:** When mutations happen we should have a way to invalidate cache
   * entries. We should also have a way to make optimistic changes to a
   * cache entry.
   *
   * **TODO:** We should be able to subscribe to changes via a WebSocket on the
   * server. So when an entry in our cache changes we can update our UI.
   *
   * [1]: https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)
   */
  private readonly entries = new Map<Key, Box<Async<Data>>>();

  constructor(load: (key: Key) => Promise<Data>) {
    this._load = load;
  }

  /**
   * Sets an entry in our cache. If the entry already exists in our entries map
   * then we will update that entry. Otherwise we will create a new one.
   */
  private setEntry(key: Key, data: Async<Data>) {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      this.entries.set(key, new Box(data));
    } else {
      entry.set(data);
    }
  }

  /**
   * Retrieves an entry from our cache. If the entry does not exist yet then
   * we will first load the entry into our cache.
   */
  private accessEntry(key: Key): Box<Async<Data>> {
    let entry = this.entries.get(key);
    if (entry === undefined) {
      entry = new Box(new Async(this._load(key)));
      this.entries.set(key, entry);
    }
    return entry;
  }

  /**
   * Inserts a resolved entry into the cache. If there is already an entry with
   * this key then that entry will be overridden.
   */
  public insert(key: Key, data: Data) {
    this.setEntry(key, new Async(data));
  }

  /**
   * Loads some data from our cache and returns a promise which will resolve
   * with the cached data. If the data has already resolved then we return a
   * promise which will resolve immediately.
   *
   * If you are loading data for a React component, please call the React hook
   * `useCacheData()` instead which will watch the cache for changes.
   */
  public load(key: Key): Promise<Data> {
    return this.accessEntry(key)
      .get()
      .promise();
  }

  /**
   * Preloads a cache entry. If the entry is not already in the cache then
   * calling this function will load the entry into the cache. We do nothing
   * with the cached result, though. If the entry is pending or rejected we
   * ignore that information.
   */
  public preload(key: Key): void {
    this.accessEntry(key);
  }
}

/**
 * Use some data from the cache in a React component. If the data has not yet
 * loaded we will throw a promise. (Suspense style.) If the data has rejected
 * then we throw an error. If the data has resolved then we return that data.
 *
 * This is a React hook and is subject to the rule of hooks. This hook
 * subscribes to the data so that when it changes the hook will re-render the
 * React component it is in.
 */
export function useCacheData<Key extends string | number, Data>(
  cache: Cache<Key, Data>,
  key: Key,
): Data {
  const entry: Box<Async<Data>> = (cache as any).accessEntry(key);
  return useBox(entry).suspend();
}
