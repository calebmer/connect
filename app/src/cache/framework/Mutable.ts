import {useEffect, useState} from "react";
import {useConstant} from "../../useConstant";

/**
 * A mutable container of a value which you can watch for changes. This is an
 * important utility for working with mutable values that are not managed by
 * a declarative UI framework like React.
 */
export class Mutable<Value> {
  /** The current value. */
  private value: Value;

  /** All of the functions which have subscribed to our mutable value. */
  private readonly subscribers = new Set<() => void>();

  /** Have we scheduled a notification for our subscribers? */
  private notifyScheduled = false;

  constructor(value: Value) {
    this.value = value;
  }

  /**
   * Gets the current mutable value. The name is long and complicated to
   * remind anyone calling this function that they are only getting the
   * _current_ value. There is a way to subscribe to the value over time.
   */
  public getAtThisMomentInTime(): Value {
    return this.value;
  }

  /**
   * Sets the current value. Also schedules an asynchronous notification so
   * that all our subscribers know the our value has updated.
   *
   * If the current value is already equal by `===` to the new value then we
   * don’t do anything.
   */
  public set(newValue: Value): void {
    if (this.value !== newValue) {
      this.value = newValue;
      this.scheduleNotify();
    }
  }

  /**
   * Subscribes to a value. The subscriber will be notified whenever the value
   * is updated. The subscriber may call `get()` to get the new value.
   */
  public subscribe(subscriber: () => void): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }

  /**
   * Schedules an asynchronous notification for all our subscribers. If a
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

/** The identity function. */
function identity<T>(x: T): T {
  return x;
}

/**
 * Uses a mutable value and subscribes to the value’s changes over time.
 */
export function useMutable<Value>(mutable: Mutable<Value>): Value {
  return useMutableSelect(mutable, identity);
}

/**
 * Uses a mutable value and subscribes to the value’s changes over time.
 *
 * We allow the caller to provide a selector function which will only select a
 * part of the mutable value. If the mutable value changes but the selection
 * does not change then the component will not re-render.
 */
export function useMutableSelect<Value, ValueSelection>(
  mutable: Mutable<Value>,
  select: (value: Value) => ValueSelection,
): ValueSelection {
  // Use a new state variable with the initial value. Make sure to
  // update the value again if it changes between our render and our effect
  // where we add a subscription below.
  const [value, setValue] = useState(select(mutable.getAtThisMomentInTime()));

  useEffect(() => {
    // There might have been an update between the render phase and the commit
    // phase. Update our state with the latest value just in case. React will
    // skip the update if our new state is equal to the old one.
    setValue(select(mutable.getAtThisMomentInTime()));

    // Subscribe to all future updates. Whenever the value updates we will also
    // update our state with the new value.
    const unsubscribe = mutable.subscribe(() => {
      setValue(select(mutable.getAtThisMomentInTime()));
    });

    // Unsubscribe when the effect is done.
    return unsubscribe;
  }, [mutable, select]);

  return value;
}

/**
 * Lifts a value into a mutable container. The mutable value is constant over
 * the lifetime of its containing component which means it won’t update any
 * `memo()` components when the value changes.
 *
 * It’s useful to put frequently changing values into a mutable container so
 * they only update the components which need them.
 *
 * When the value changes we update the mutable value in an effect. Which will
 * trigger another render in subscribers to this mutable value instead of
 * updating the value in the current render phase.
 */
export function useMutableContainer<Value>(value: Value): Mutable<Value> {
  // Create a constant mutable container which will never change across
  // component renders. Use the initial value for that mutable container.
  const mutable = useConstant(() => new Mutable(value));

  // Whenever the value changes, update our mutable container. The updated value
  // will not be reflected in listeners for this render phase, but it will
  // trigger an update which will re-render the app.
  useEffect(() => {
    mutable.set(value);
  }, [mutable, value]);

  return mutable;
}
