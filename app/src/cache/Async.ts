import {useEffect, useRef} from "react";
import {useForceUpdate} from "../utils/useForceUpdate";

/** The status of an async value. Can be any of the promise statuses. */
enum AsyncStatus {
  Pending,
  Resolved,
  Rejected,
}

/**
 * `Async` is a wrapper around a promise that allows us to inspect the
 * promise’s internal state. This gives us the ability to synchronously access
 * the value of a resolved promise.
 *
 * The value of a `Async` is immutable. It represents some value that we will
 * have access to _in the future_. Basically every synchronous value is like
 * this except `Async` allows us to do the work to compute a
 * value asynchronously.
 *
 * May also be rejected. That means whenever we try to access the value we will
 * throw instead.
 */
export class Async<Value> {
  /** The status of our async value. */
  private status: AsyncStatus;

  /**
   * Our async value. The type of the value changes depending on the
   * current status.
   *
   * - If our status is “pending” then the value is a promise.
   * - If our status is “resolved” then the value is the one resolved by
   *   the promise.
   * - If our status is “rejected” then the value is the error thrown by
   *   our promise.
   */
  private value: unknown;

  constructor(value: Promise<Value> | Value) {
    if (value instanceof Promise) {
      this.status = AsyncStatus.Pending;
      this.value = value;
      value.then(
        value => {
          this.status = AsyncStatus.Resolved;
          this.value = value;
        },
        error => {
          this.status = AsyncStatus.Rejected;
          this.value = error;
        },
      );
    } else {
      this.status = AsyncStatus.Resolved;
      this.value = value;
    }
  }

  /**
   * Gets the asynchronous value. If the value is resolved then we synchronously
   * return it. Otherwise we return a promise that resolves when the
   * asynchronous value is ready.
   *
   * If the asynchronous value rejected then we _synchronously_ throw an error.
   */
  public get(): Value | Promise<Value> {
    switch (this.status) {
      case AsyncStatus.Pending:
        return this.value as Promise<Value>;
      case AsyncStatus.Resolved:
        return this.value as Value;
      case AsyncStatus.Rejected:
        throw this.value;
      default: {
        const never: never = this.status;
        throw new Error(`Unexpected status: ${never}`);
      }
    }
  }

  /**
   * Suspends the current execution if the async value has not finished loading.
   * Based on React’s definition of suspense. If the promise is rejected then we
   * will throw the error. Otherwise we will return the resolved
   * value synchronously.
   *
   * There are some parallel’s to the Rust future’s `poll()` function. If the
   * asynchronous value is not ready then we throw a promise which tells the
   * runtime (in our case, React) when to wake-up our function for
   * running again.
   */
  public suspend(): Value {
    switch (this.status) {
      case AsyncStatus.Pending:
        throw this.value as Promise<Value>;
      case AsyncStatus.Resolved:
        return this.value as Value;
      case AsyncStatus.Rejected:
        throw this.value;
      default: {
        const never: never = this.status;
        throw new Error(`Unexpected status: ${never}`);
      }
    }
  }
}

/**
 * A unique symbol we use to represent a “no value” state since using null or
 * undefined could lead to buggy behavior if an expected value is null
 * or undefined.
 */
const noValue = Symbol();

/**
 * Uses an asynchronous value.
 *
 * - If the asynchronous value is pending and we’ve rendered before with a
 *   different asynchronous value then we will use the previous value and set
 *   `loading` to true.
 *
 * - If the asynchronous value is pending and we’ve not rendered a value before
 *   then suspend by throwing the asynchronous value’s promise. Or if the
 *   programmer provided an “initial value” we will use that instead
 *   of suspending.
 */
export function useAsyncWithPrev<Value>(
  asyncValue: Async<Value>,
  initialValue?: Value,
): {
  loading: boolean;
  value: Value;
} {
  // Re-render our component whenever the async value changes from a pending
  // state to a resolved or rejected state.
  const value = useAsyncForceUpdate(asyncValue);

  // The previous value we rendered.
  const prevValue = useRef<Value | typeof noValue>(
    initialValue === undefined ? noValue : initialValue,
  );

  // If our asynchronous value is pending and we have a previous value then
  // return the previous value. Otherwise suspend.
  if (value instanceof Promise) {
    if (prevValue.current === noValue) {
      throw value;
    } else {
      return {loading: true, value: prevValue.current};
    }
  } else {
    // Update the previous value and return the resolved value.
    prevValue.current = value;
    return {loading: false, value};
  }
}

/**
 * Toggles between `null` and `Value` depending on whether the async value is
 * pending or resolved respectively. If the promise rejects then we will
 * synchronously throw an error.
 *
 * TODO: better name
 */
export function useAsyncWithToggle<Value>(
  asyncValue: Async<Value>,
): Value | null {
  // Re-render our component whenever the async value changes from a pending
  // state to a resolved or rejected state.
  const value = useAsyncForceUpdate(asyncValue);

  return value instanceof Promise ? null : value;
}

/**
 * Force updates the component when the async value transitions from pending to
 * either resolved or rejected. Useful for building `Async` hooks that depend
 * on the component re-rendering when our async state changes.
 */
function useAsyncForceUpdate<Value>(
  asyncValue: Async<Value>,
): Value | Promise<Value> {
  // Get the asynchronous value. This will give us a `Promise` if the value is
  // pending and will throw if the value is rejected.
  const value = asyncValue.get();

  // Force update function lets us manually refresh our component.
  const forceUpdate = useForceUpdate();

  // When we have a pending asynchronous value then attach event handlers to
  // the promise which will force update our component when we’ve resolved.
  useEffect(() => {
    if (!(value instanceof Promise)) {
      return;
    }

    let cancelled = false;

    function done() {
      if (!cancelled) {
        forceUpdate();
      }
    }

    value.then(done, done);

    return () => {
      cancelled = true;
    };
  }, [forceUpdate, value]);

  return value;
}
