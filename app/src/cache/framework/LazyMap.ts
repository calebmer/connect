/**
 * A lazy map is one where values with keys may eventually get computed. It
 * accepts a pure function in its constructor for producing these values.
 */
export class LazyMap<Key, Value> {
  /**
   * A pure function which computes a value for the provided key.
   */
  private readonly load: (key: Key) => Value;

  /**
   * A cache of all the values which have already been computed.
   */
  private readonly values = new Map<Key, Value>();

  constructor(load: (key: Key) => Value) {
    this.load = load;
  }

  /**
   * Returns a value from the map. If the value has not yet been computed then
   * we will compute the value first.
   */
  get(key: Key): Value {
    let value = this.values.get(key);
    if (value === undefined) {
      value = this.load(key);
      this.values.set(key, value);
    }
    return value;
  }
}
