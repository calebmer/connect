import {useEffect, useState} from "react";

/**
 * A mutable container of a value which you can watch for changes. This is an
 * important utility for working with mutable values that are not managed by
 * a declarative UI framework like React.
 */
export class CacheValue<Value> {
  /** The current value. */
  private value: Value;

  /** All of the functions which have subscribed to value changes. */
  private readonly subscribers = new Set<() => void>();

  /** Have we scheduled a notification for our subscribers? */
  private notifyScheduled = false;

  constructor(value: Value) {
    this.value = value;
  }

  /**
   * Gets the current value.
   */
  get(): Value {
    return this.value;
  }

  /**
   * Sets the value. Also schedules an asynchronous notification so that all our
   * subscribers know the we’ve updated.
   */
  set(newValue: Value): void {
    this.value = newValue;
    this.scheduleNotify();
  }

  /**
   * Subscribes to a value. The subscriber will be notified whenever the value
   * is updated. The subscriber may call `get()` to get the new value.
   */
  subscribe(subscriber: () => void): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * Schedules an asynchronous notification to all our value’s subscribers. If a
   * notification is already scheduled then we don’t schedule another one.
   *
   * Currently we schedule a microtask with `Promise.resolve()`.
   */
  private scheduleNotify() {
    if (this.notifyScheduled === false) {
      this.notifyScheduled = true;
      Promise.resolve().then(() => {
        this.notifyScheduled = false;
        this.subscribers.forEach(subscriber => subscriber());
      });
    }
  }
}

/**
 * Uses the current value of a `CacheValue` in a React component and subscribes
 * to all future changes.
 */
export function useCacheValue<Value>(cacheValue: CacheValue<Value>): Value {
  // Use a new state variable with the initial. Make sure to update the value
  // again if it changes between our render and our effect where we add a
  // subscription below.
  const [value, setValue] = useState(cacheValue.get());

  useEffect(() => {
    // There might have been an update between the render phase and the commit
    // phase. Update our state with the latest value just in case. React will
    // skip the update if our new state is equal to the old one.
    setValue(cacheValue.get());

    // Subscribe to all future updates. Whenever the value updates we will also
    // update our state with the new value.
    const unsubscribe = cacheValue.subscribe(() => {
      setValue(cacheValue.get());
    });

    // Unsubscribe when the effect is done.
    return unsubscribe;
  }, [cacheValue]);

  return value;
}
