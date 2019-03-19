import {Mutable} from "./Mutable";

/**
 * A mutable value with the ability to queue asynchronous updates. The
 * `update()` function will run all of the updaters sequentially.
 */
export class MutableLock<Value> extends Mutable<Value> {
  /**
   * We use a promise as our “lock” on the mutable value. Every time `update()`
   * is called we first wait for our lock to resolve (release) and then we
   * set the lock (locking) to a promise which will resolve when the provided
   * updater resolves.
   */
  private lock = Promise.resolve<unknown>(undefined);

  /**
   * Updates our mutable value with an asynchronous updater function. All
   * asynchronous updaters will be run in parallel. Calling `set()` while an
   * updater is still running will be overridden when the update finishes.
   */
  public update(updater: (value: Value) => Promise<Value>): Promise<Value> {
    const newLock = this.lock.then(() => {
      const oldValue = this.get();
      const newValue = updater(oldValue);
      return newValue;
    });
    this.lock = newLock.then(newValue => this.set(newValue));
    return newLock;
  }
}
