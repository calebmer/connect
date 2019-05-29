import {useEffect, useRef} from "react";
import {FastEquals} from "../utils/fastEquals";
import {useForceUpdate} from "../utils/useForceUpdate";

/** The status of an async value. Can be any of the promise statuses. */
enum AsyncStatus {
  Pending = "pending",
  Resolved = "resolved",
  Rejected = "rejected",
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
export class Async<Value> implements FastEquals {
  /**
   * Returns a rejected `Async` value.
   */
  public static rejected(error: unknown): Async<never> {
    const asyncValue = Object.create(Async.prototype);
    asyncValue.status = AsyncStatus.Rejected;
    asyncValue.value = error;
    return asyncValue;
  }

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
   * Is our async value currently loading?
   */
  public isLoading(): boolean {
    return this.status === AsyncStatus.Pending;
  }

  /**
   * Was our async value rejected?
   */
  public isRejected(): boolean {
    return this.status === AsyncStatus.Rejected;
  }

  /**
   * Gets the asynchronous value. If the value is resolved then we synchronously
   * return it. Otherwise we return a promise that resolves when the
   * asynchronous value is ready.
   *
   * If the asynchronous value rejected then we _synchronously_ throw an error.
   */
  public get(): Value | Promise<Value> {
    const asyncValue = (this as unknown) as AsyncUnion<Value>;
    switch (asyncValue.status) {
      case AsyncStatus.Pending:
        return asyncValue.value;
      case AsyncStatus.Resolved:
        return asyncValue.value;
      case AsyncStatus.Rejected:
        throw asyncValue.value;
      default: {
        const never: never = asyncValue["status"];
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
    const asyncValue = (this as unknown) as AsyncUnion<Value>;
    switch (asyncValue.status) {
      case AsyncStatus.Pending:
        throw asyncValue.value;
      case AsyncStatus.Resolved:
        return asyncValue.value;
      case AsyncStatus.Rejected:
        throw asyncValue.value;
      default: {
        const never: never = asyncValue["status"];
        throw new Error(`Unexpected status: ${never}`);
      }
    }
  }

  /**
   * Quickly checks if this value is equal to another value of an unknown type.
   */
  public fastEquals(other: unknown): boolean {
    return (
      other instanceof Async &&
      this.status === other.status &&
      this.value === other.value
    );
  }
}

/**
 * An `Async<Value>` is always in one of these states. However, we can’t model
 * a mutable class as a union in this way. We have a type alias to easily “view”
 * our class as a union.
 */
type AsyncUnion<Value> =
  | {
      readonly status: AsyncStatus.Pending;
      readonly value: Promise<Value>;
    }
  | {
      readonly status: AsyncStatus.Resolved;
      readonly value: Value;
    }
  | {
      readonly status: AsyncStatus.Rejected;
      readonly value: unknown;
    };

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

/**
 * Returns the last known good value from the async container. If when we render
 * for the first time the async container is pending or rejected then we will
 * suspend or throw respectively. If when the hook re-renders with a pending or
 * rejected async container after receiving a good async container then we will
 * return the previous good value along with the error/loading state.
 */
export function useAsyncWithLastKnownGood<Value>(
  asyncValue: Async<Value>,
): {loading: boolean; error: unknown; value: Value} {
  // Cast to an `AsyncUnion` so we can work with the internals.
  const asyncValueUnion = (asyncValue as unknown) as AsyncUnion<Value>;

  // Remember the last value and the last error we’ve seen.
  const lastValue = useRef<Value | typeof noValue>(noValue);
  const lastError = useRef<unknown>(null);

  // Force update function lets us manually refresh our component.
  const forceUpdate = useForceUpdate();

  // When we have a pending asynchronous value then attach event handlers to
  // the promise which will force update our component when we’ve resolved.
  useEffect(() => {
    if (asyncValueUnion.status !== AsyncStatus.Pending) {
      return;
    }

    let cancelled = false;

    function done() {
      if (!cancelled) {
        forceUpdate();
      }
    }

    asyncValueUnion.value.then(done, done);

    return () => {
      cancelled = true;
    };
  }, [asyncValueUnion, forceUpdate]);

  switch (asyncValueUnion.status) {
    // Return a resolved async value! Make sure to clear the error out first.
    // We are now successful and should not show an error.
    case AsyncStatus.Resolved: {
      lastValue.current = asyncValueUnion.value;
      lastError.current = null;
      return {
        loading: false,
        error: lastError.current,
        value: lastValue.current,
      };
    }

    // If we’re pending then suspend unless we have a last value. If we have
    // a previous value then return that along with the last error.
    case AsyncStatus.Pending: {
      if (lastValue.current !== noValue) {
        return {
          loading: true,
          error: lastError.current,
          value: lastValue.current,
        };
      } else {
        throw asyncValueUnion.value;
      }
    }

    // If we’ve rejected then throw the error unless we have a last value. If
    // we have a previous value then return that along with the error.
    case AsyncStatus.Rejected: {
      lastError.current = asyncValueUnion.value;
      if (lastValue.current !== noValue) {
        return {
          loading: false,
          error: lastError.current,
          value: lastValue.current,
        };
      } else {
        throw lastError.current;
      }
    }

    default: {
      const never: never = asyncValueUnion["status"];
      throw new Error(`Unexpected status: ${never}`);
    }
  }
}
