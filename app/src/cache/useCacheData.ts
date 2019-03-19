import {Cache} from "./Cache";

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
  return cache.accessEntry(key).suspend();
}
