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
   * Converts our async value into a promise. If the promise is resolved or
   * rejected then we will return a promise that resolves/rejects immediately.
   */
  public promise(): Promise<Value> {
    switch (this.status) {
      case AsyncStatus.Pending:
        return this.value as Promise<Value>;
      case AsyncStatus.Resolved:
        return Promise.resolve(this.value as Value);
      case AsyncStatus.Rejected:
        return Promise.reject(this.value);
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
