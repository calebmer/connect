import {Cache} from "./Cache";

const registeredCaches = new Set<Cache<any, any>>();

/**
 * The repair module is used for attempting to repair a broken cache. When
 * `Repair.attempt()` is called we try to refetch all the failed cache entries
 * we can.
 */
export const Repair = {
  /**
   * Attempt to repair our registered caches.
   *
   * WARNING: This can be super expensive since we synchronously iterate through
   * _all_ of our caches and _all_ of the items in each cache!
   */
  attempt() {
    registeredCaches.forEach(cache => {
      cache.forceReloadFailedEntries();
    });
  },

  /**
   * Registers a cache which can be repaired.
   *
   * Returns a function to unregister the cache.
   */
  registerCache(cache: Cache<any, any>): () => void {
    if (registeredCaches.has(cache)) {
      throw new Error("Cannot register the same cache twice.");
    }
    registeredCaches.add(cache);
    return () => registeredCaches.delete(cache);
  },
};
