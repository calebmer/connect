/**
 * In entry in our cache. Represents some data in an asynchronous loading state.
 * This data structure allows us to know synchronously whether or not our cache
 * entry has resolved and if it has resolved what the value is.
 *
 * Also provides some utility as a “lock”. While the entry is in a pending state
 * we won’t be able to update the entry. Once the entry resolves we can
 * update it.
 *
 * You can think of this class as a fancy abstraction for:
 *
 * ```ts
 * type CacheEntry<Value> =
 *   | {readonly status: CacheEntryStatus.Pending; readonly value: Promise<Value>}
 *   | {readonly status: CacheEntryStatus.Resolved; readonly value: Value}
 *   | {readonly status: CacheEntryStatus.Rejected; readonly value: unknown};
 * ```
 */
export class CacheEntry<Value> {
  /**
   * Create a pending cache entry using a promise. Once the promise resolves the
   * cache entry will automatically resolve itself.
   */
  public static pending<Value>(promise: Promise<Value>): CacheEntry<Value> {
    const entry = new CacheEntry<Value>(CacheEntryStatus.Pending, promise);
    promise.then(
      value => {
        entry.status = CacheEntryStatus.Resolved;
        entry.value = value;
      },
      error => {
        entry.status = CacheEntryStatus.Rejected;
        entry.value = error;
      },
    );
    return entry;
  }

  /**
   * Create a resolved cache entry.
   */
  public static resolved<Value>(value: Value): CacheEntry<Value> {
    return new CacheEntry(CacheEntryStatus.Resolved, value);
  }

  /**
   * The status of our cache entry.
   */
  private status: CacheEntryStatus;

  /**
   * The value of our cache entry. Its type changes depending on the type of
   * `this.status`:
   *
   * - `CacheEntryStatus.Pending`: `Promise<Value>`
   * - `CacheEntryStatus.Resolved`: `Value`
   * - `CacheEntryStatus.Rejected`: `unknown`
   */
  private value: unknown;

  private constructor(status: CacheEntryStatus, value: unknown) {
    this.status = status;
    this.value = value;
  }

  /**
   * Converts the cache entry into a promise. If the cache entry is resolved or
   * rejected then we return a promise that either immediately resolves
   * or rejects.
   */
  public promise(): Promise<Value> {
    switch (this.status) {
      case CacheEntryStatus.Pending:
        return this.value as Promise<Value>;
      case CacheEntryStatus.Resolved:
        return Promise.resolve(this.value as Value);
      case CacheEntryStatus.Rejected:
        return Promise.reject(this.value);
      default:
        throw new Error(`Unexpected status: ${this.status}`);
    }
  }

  /**
   * Converts the cache entry into a React suspense completion. Use this in a
   * React component to handle loading states.
   */
  public suspend(): Value {
    switch (this.status) {
      case CacheEntryStatus.Pending:
        throw this.value as Promise<Value>;
      case CacheEntryStatus.Resolved:
        return this.value as Value;
      case CacheEntryStatus.Rejected:
        throw this.value;
      default:
        throw new Error(`Unexpected status: ${this.status}`);
    }
  }

  /**
   * Synchronized updates for a cache entry value. You may call `update()` as
   * much as you want on a cache entry and the updates will always be called
   * in order.
   *
   * Returns a promise that resolves with the new value once the update
   * finishes. The update might first have to wait for other updates to finish.
   */
  public update(updater: (value: Value) => Promise<Value>): Promise<Value> {
    switch (this.status) {
      // If the cache entry is currently pending then wait for it to resolve
      // and try updating again.
      case CacheEntryStatus.Pending: {
        return (this.value as Promise<Value>).then(() => this.update(updater));
      }

      // If the cache entry is resolved then we can update the value! Convert
      // the cache entry into a pending entry until the updater
      // function resolves.
      case CacheEntryStatus.Resolved: {
        const promise = updater(this.value as Value);
        this.status = CacheEntryStatus.Pending;
        this.value = promise;
        return promise.then(
          value => {
            this.status = CacheEntryStatus.Resolved;
            this.value = value;
            return value;
          },
          error => {
            this.status = CacheEntryStatus.Rejected;
            this.value = error;
            throw error;
          },
        );
      }

      // Rejected cache entries are poisonous. They always throw.
      case CacheEntryStatus.Rejected:
        return Promise.reject(this.value);

      default:
        throw new Error(`Unexpected status: ${this.status}`);
    }
  }
}

/**
 * The status of a cache entry.
 */
enum CacheEntryStatus {
  Pending,
  Resolved,
  Rejected,
}
