/**
 * A lazy value is one which may be eventually computed. A lazy value will
 * _always_ return the same value after `get()` no matter when it is called. A
 * lazy value is effectively immutable and pure. It is mostly an implementation
 * detail for an alternative evaluation strategy.
 */
export class Lazy<Value> {
  /**
   * The status of our lazy value. Determines the type of `this.value`.
   */
  private status: LazyStatus;

  /**
   * Either the lazy value itself or a function to compute the lazy value. The
   * type of this field is determined by `this.status`.
   */
  private value: Value | (() => Value);

  constructor(load: () => Value) {
    this.status = LazyStatus.Empty;
    this.value = load;
  }

  /**
   * Gets the lazy value. If the value has been evaluated before then we return
   * the value. If the value has not been evaluated before then we evaluate
   * it now and return the new value.
   */
  get(): Value {
    if (this.status === LazyStatus.Empty) {
      this.value = (this.value as () => Value)();
      this.status = LazyStatus.Filled;
    }
    return this.value as Value;
  }
}

/** The status of a lazy value. */
enum LazyStatus {
  Empty,
  Filled,
}
