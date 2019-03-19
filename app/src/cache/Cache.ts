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
  private readonly entries = new Map<Key, CacheEntry<Data>>();

  constructor(load: (key: Key) => Promise<Data>) {
    this._load = load;
  }

  /**
   * Retrieves an entry from our cache. If the entry does not exist yet then we
   * will first load the entry into our cache.
   */
  public accessEntry(key: Key): CacheEntry<Data> {
    let entry = this.entries.get(key);
    if (entry === undefined) {
      const promise = this._load(key);
      entry = {
        status: CacheEntryStatus.Pending,
        value: promise,
      };
      promise.then(
        value => {
          (entry as any).status = CacheEntryStatus.Resolved;
          (entry as any).value = value;
        },
        error => {
          (entry as any).status = CacheEntryStatus.Rejected;
          (entry as any).value = error;
        },
      );
      this.entries.set(key, entry);
    }
    return entry;
  }

  /**
   * Inserts a resolved entry into the cache. If there is already an entry with
   * this key then that entry will be overridden.
   */
  public insert(key: Key, data: Data) {
    this.entries.set(key, {status: CacheEntryStatus.Resolved, value: data});
  }

  /**
   * Loads some data from our cache and returns a promise which will resolve
   * with the cached data. If the data has already resolved then we return a
   * promise which will resolve immediately.
   *
   * If you are loading data for a React component, please call the React hook
   * `useData()` instead.
   */
  public load(key: Key): Promise<Data> {
    const entry = this.accessEntry(key);
    switch (entry.status) {
      case CacheEntryStatus.Pending:
        return entry.value;
      case CacheEntryStatus.Resolved:
        return Promise.resolve(entry.value);
      case CacheEntryStatus.Rejected:
        return Promise.reject(entry.value);
      default: {
        const never: never = entry;
        throw new Error(`Unexpected entry status: ${never["status"]}`);
      }
    }
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
 * An entry in our cache. An entry could be in any asynchronous data
 * fetching state.
 */
export type CacheEntry<Data> =
  | {readonly status: CacheEntryStatus.Pending; readonly value: Promise<Data>}
  | {readonly status: CacheEntryStatus.Resolved; readonly value: Data}
  | {readonly status: CacheEntryStatus.Rejected; readonly value: unknown};

/**
 * The status of a cache entry.
 */
export enum CacheEntryStatus {
  Pending,
  Resolved,
  Rejected,
}
