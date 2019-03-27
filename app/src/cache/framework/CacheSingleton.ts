import {Async} from "./Async";

/**
 * Caches some data which is the only one of its kind.
 */
export class CacheSingleton<Data> {
  /**
   * User provided function for loading a new cache entry.
   */
  private readonly _load: () => Promise<Data>;

  /**
   * The currently cached entry.
   */
  private entry: Async<Data> | undefined = undefined;

  constructor(load: () => Promise<Data>) {
    this._load = load;
  }

  /**
   * Retrieves the entry from our cache. If the entry does not exist yet then
   * we will first load the entry into our cache.
   */
  private accessEntry(): Async<Data> {
    if (this.entry === undefined) {
      this.entry = new Async(this._load());
    }
    return this.entry;
  }

  /**
   * Preloads the cache’s data. If the cache is not yet loaded then we will
   * fetch the data. Otherwise we will do nothing.
   */
  public preload(): void {
    this.accessEntry();
  }
}

/**
 * Uses the data from a `CacheSingleton` instance.
 */
export function useCacheSingletonData<Data>(cache: CacheSingleton<Data>): Data {
  const entry: Async<Data> = (cache as any).accessEntry();
  return entry.suspend();
}
