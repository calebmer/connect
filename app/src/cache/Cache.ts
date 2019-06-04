import {Async, useAsyncWithLastKnownGood, useAsyncWithPrev} from "./Async";
import {Mutable, ReadonlyMutable, useMutable} from "./Mutable";

/**
 * Responsible for caching data.
 */
export class Cache<Key extends string | number, Data> {
  /**
   * User provided function for loading a new cache entry.
   */
  private readonly _load: (key: Key) => Promise<Data>;

  /**
   * User provided function for loading many cache entries at once. This
   * function is used as an *optional* performance win when fetching many items
   * with known IDs at once is common.
   *
   * We expect this function to return the same number of items as there were
   * provided keys.
   */
  private readonly _loadMany:
    | undefined
    | ((keys: ReadonlyArray<Key>) => Promise<ReadonlyArray<Data | Error>>);

  /**
   * All the currently cached entries.
   *
   * **TODO:** Currently, the cache is unbounded. It will keep growing and
   * growing! We should add a way to garbage collect unused entries. Maybe
   * an [LRU cache algorithm][1]?
   *
   * [1]: https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_recently_used_(LRU)
   */
  private readonly entries = new Map<Key, Mutable<Async<Data>>>();

  constructor({
    load,
    loadMany,
  }: {
    load: (key: Key) => Promise<Data>;
    loadMany?: (
      keys: ReadonlyArray<Key>,
    ) => Promise<ReadonlyArray<Data | Error>>;
  }) {
    this._load = load;
    this._loadMany = loadMany;
  }

  /**
   * Retrieves an entry from our cache. If the entry does not exist yet then
   * we will first load the entry into our cache.
   */
  private accessEntry(key: Key): Mutable<Async<Data>> {
    let entry = this.entries.get(key);
    if (entry === undefined) {
      entry = new Mutable(new Async(this._load(key)));
      this.entries.set(key, entry);
    }
    return entry;
  }

  /**
   * Inserts an async entry in our cache. If there is already an entry with
   * this key then that entry will be overridden.
   */
  private insertEntry(key: Key, data: Async<Data>): void {
    const entry = this.entries.get(key);
    if (entry === undefined) {
      this.entries.set(key, new Mutable(data));
    } else {
      entry.set(data);
    }
  }

  /**
   * Inserts a resolved entry into the cache. If there is already an entry with
   * this key then that entry will be overridden.
   */
  public insert(key: Key, data: Data): void {
    this.insertEntry(key, new Async(data));
  }

  /**
   * Updates some data in our cache. If the data associated with the provided
   * key does not exist then we will first load the data. If the data associated
   * with the provided key is currently pending then we will wait for it to
   * resolve before executing our updater.
   */
  public updateWhenReady(
    key: Key,
    updater: (data: Data) => Data | Promise<Data>,
  ): void {
    const entry = this.accessEntry(key);

    actuallyUpdate();

    function actuallyUpdate(): void {
      try {
        const data = entry.getAtThisMomentInTime().get();
        if (data instanceof Promise) {
          data.then(() => actuallyUpdate(), () => actuallyUpdate());
        } else {
          try {
            entry.set(new Async(updater(data)));
          } catch (error) {
            entry.set(Async.rejected(error));
          }
        }
      } catch (error) {
        // noop: we expect the error to be handled in our UI.
      }
    }
  }

  /**
   * Is the entry with the provided key currently loading? If the entry does
   * not yet exist then we will load it and then check.
   */
  public isLoading(key: Key): boolean {
    return this.accessEntry(key)
      .getAtThisMomentInTime()
      .isLoading();
  }

  /**
   * Retrieves an entry from our cache. If the entry does not exist yet then
   * we will first load the entry into our cache.
   */
  public loadEntry(key: Key): ReadonlyMutable<Async<Data>> {
    return this.accessEntry(key);
  }

  /**
   * Loads some data from our cache and returns a promise which will resolve
   * when the cached data has loaded.
   *
   * If you are loading data for a React component, please call the React hook
   * `useCacheData()` instead which will watch the cache for changes.
   *
   * NOTE: The promise might resolve _after_ we actually get data in the cache.
   * For example, someone calls `load(key)` which starts loading new data and
   * returns a promise. Before that promise resolves someone else calls
   * `insert(key)` which means the cache now has data for this key. But our
   * promise is still waiting for the async data to resolve! We need to consider
   * this before open sourcing.
   */
  public async load(key: Key): Promise<void> {
    await this.accessEntry(key)
      .getAtThisMomentInTime()
      .get();
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

  /**
   * Forces the cache to reload data for the given key. We immediately change
   * the cache entry to the pending asynchronous value. If there are any
   * watchers that want to use the previously cached value they’ll have to do
   * that on their own.
   *
   * Does not reject even if the underlying request fails.
   *
   * NOTE: The promise might resolve _after_ we actually get data in the cache.
   * For example, someone calls `load(key)` which starts loading new data and
   * returns a promise. Before that promise resolves someone else calls
   * `insert(key)` which means the cache now has data for this key. But our
   * promise is still waiting for the async data to resolve! We need to consider
   * this before open sourcing.
   */
  public async forceReload(key: Key): Promise<void> {
    const data = this._load(key);
    this.insertEntry(key, new Async(data));
    await data.catch(() => {}); // Errors should be handled by cache consumers.
  }

  /**
   * Loads many keys into our cache and returns a promise which resolves when
   * all of our keys have finished loading. We don’t return an array of loaded
   * values, though. You can use `load()` to get individual values if you want.
   *
   * If a `loadMany()` function was provided we use that to only make one API
   * request instead of many API requests.
   */
  public async loadMany(keys: ReadonlySet<Key>): Promise<void> {
    // The preload function does most of the work here, but it doesn’t
    // return anything.
    this.preloadMany(keys);

    // Access all our mutable values at the time our function is called. We only
    // want to wait for the *current* set of keys to load. We don’t care about
    // reloads after this function is called.
    const values = Array<Async<Data>>(keys.size);
    let i = 0;
    for (const key of keys) {
      values[i++] = this.accessEntry(key).getAtThisMomentInTime();
    }

    // Loop through all of our values. If the value is a promise then let’s
    // wait for that value to resolve...
    for (let i = 0; i < values.length; i++) {
      const value = values[i].get();
      if (value instanceof Promise) await value;
    }
  }

  /**
   * Preloads many keys into our cache. If a key already exists with a cache
   * entry then we don’t make another request. Takes a set as a parameter to
   * enforce that no duplicate keys are provided.
   *
   * If a `loadMany()` function was provided we use that to only make one API
   * request instead of many API requests.
   *
   * TODO: test this
   */
  public preloadMany(keys: ReadonlySet<Key>): void {
    // If we don’t have a `loadMany` function then preload each
    // key individually.
    if (this._loadMany === undefined) {
      for (const key of keys) {
        this.preload(key);
      }
      return;
    }

    // The actual array of keys we will send to our `loadMany` function. Does
    // not contain duplicates and does not contain keys we’ve already cached.
    const actualKeys: Array<Key> = [];

    // Loop through all our provided keys. Remove duplicates and ignore keys
    // that are already cached.
    for (const key of keys) {
      // If we’ve already cached this key then skip...
      if (this.entries.has(key)) continue;

      // Otherwise we will need to fetch this key!
      actualKeys.push(key);
    }

    // If we don’t find any keys we actually need to fetch then we don’t need
    // to make a network request. Hooray!
    if (actualKeys.length < 1) return;

    // Load all our keys! If we end up getting a different number of items back
    // then we expected then we will throw an error.
    const valuesPromise = this._loadMany(actualKeys).then(values => {
      if (values.length !== actualKeys.length) {
        throw new Error(
          `Expected ${
            actualKeys.length
          } item(s) to be returned from \`loadMany()\` but instead we got ${
            values.length
          } item(s).`,
        );
      } else {
        return values;
      }
    });

    // Set new entries for all of the keys we are fetching. The entry is an
    // async value that will resolve when our `loadMany()` request resolves.
    for (let i = 0; i < actualKeys.length; i++) {
      const key = actualKeys[i];
      const valuePromise = valuesPromise.then(values => {
        const value = values[i];
        if (value instanceof Error) {
          throw value;
        } else {
          return value;
        }
      });
      this.insertEntry(key, new Async(valuePromise));
    }
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
export function useCache<Key extends string | number, Data>(
  cache: Cache<Key, Data>,
  key: Key,
): Data {
  const entry = cache.loadEntry(key);
  return useMutable(entry).suspend();
}

/**
 * Use some data from the cache in a React component. If the data has not yet
 * loaded and we have not rendered before with some data then we will throw a
 * promise. (Suspense style.) If the data has rejected then we will throw
 * an error.
 *
 * Remember that if that cache entry ever reloads we will return the previous
 * data and set loading to true!
 *
 * If `initialData` is provided then we will use that when the component first
 * renders instead of suspending. Which means this hook will never suspend if
 * `initialData` is set.
 */
export function useCacheWithPrev<Key extends string | number, Data>(
  cache: Cache<Key, Data>,
  key: Key,
  initialData?: Data,
): {loading: boolean; data: Data} {
  const entry = cache.loadEntry(key);
  const {loading, value} = useAsyncWithPrev(useMutable(entry), initialData);
  return {loading, data: value};
}

/**
 * Use some data from the cache in a React component. If the data has not yet
 * loaded and we have not rendered before with some data then we will throw a
 * promise. (Suspense style.) If the data has rejected then we will throw
 * an error.
 *
 * If the cache reloads data then we will return the last successfully
 * loaded value.
 */
export function useCacheWithLastKnownGood<Key extends string | number, Data>(
  cache: Cache<Key, Data>,
  key: Key,
): {loading: boolean; error: unknown; data: Data} {
  const entry = cache.loadEntry(key);
  const {loading, error, value} = useAsyncWithLastKnownGood(useMutable(entry));
  return {loading, error, data: value};
}
