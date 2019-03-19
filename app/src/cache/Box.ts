import {useEffect, useState} from "react";

/**
 * A mutable container of a value which you can watch for changes. This is an
 * important utility for working with mutable values that are not managed by
 * a declarative UI framework like React.
 */
export class Box<Value> {
  /** The current value of our box. */
  private value: Value;

  /** All of the functions which have subscribed to our box. */
  private readonly subscribers = new Set<() => void>();

  /** Have we scheduled a notification for our subscribers? */
  private notifyScheduled = false;

  constructor(value: Value) {
    this.value = value;
  }

  /**
   * Gets the current value of our box.
   */
  get(): Value {
    return this.value;
  }

  /**
   * Sets the value of our box. Also schedules an asynchronous notification so
   * that all our subscribers know the box has updated.
   */
  set(newValue: Value): void {
    this.value = newValue;
    this.scheduleNotify();
  }

  /**
   * Subscribes to a box. The subscriber will be notified whenever the box is
   * updated. The subscriber may call `get()` to get the box’s new value.
   */
  subscribe(subscriber: () => void): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * Schedules an asynchronous notification to all our box’s subscribers. If a
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
 * Uses the value of a box and subscribes the component to all future changes.
 */
export function useBox<Value>(box: Box<Value>): Value {
  // Use a new state variable with the initial value of our box. Make sure to
  // update the value again if it changes between our render and our effect
  // where we add a subscription below.
  const [value, setValue] = useState(box.get());

  useEffect(() => {
    // There might have been an update between the render phase and the commit
    // phase. Update our state with the latest value just in case. React will
    // skip the update if our new state is equal to the old one.
    setValue(box.get());

    // Subscribe to all future updates. Whenever the box updates we will also
    // update our state with the box’s new value.
    const unsubscribe = box.subscribe(() => {
      setValue(box.get());
    });

    // Unsubscribe when the effect is done.
    return unsubscribe;
  }, [box]);

  return value;
}
