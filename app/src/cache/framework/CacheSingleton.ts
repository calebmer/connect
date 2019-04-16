import {Async} from "./Async";
import {Lazy} from "./Lazy";

/**
 * Caches some data which is the only one of its kind.
 */
export class CacheSingleton<Data> {
  /**
   * The currently cached entry.
   */
  private entry: Lazy<Async<Data>>;

  constructor(load: () => Promise<Data>) {
    this.entry = new Lazy(() => new Async(load()));
  }

  /**
   * Retrieves the entry from our cache. If the entry does not exist yet then
   * we will first load the entry into our cache.
   */
  private accessEntry(): Async<Data> {
    return this.entry.get();
  }

  /**
   * Loads the data from our cache and returns a promise which will resolve
   * when the cached data has loaded.
   *
   * If you are loading data for a React component, please call the React hook
   * `useCacheSingletonData()` instead which will watch the cache for changes.
   */
  public load(): Promise<Data> {
    return Promise.resolve(this.accessEntry().get());
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
