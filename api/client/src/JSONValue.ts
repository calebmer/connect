/**
 * A read-only JSON compatible value.
 *
 * Useful as an upper-bound for further refining a type which we expect to be
 * JSON compatible.
 *
 * **NOTE:** We intentionally don’t include `undefined` because JSON does not
 * have a representation for undefined. `JSON.stringify()`s behavior when
 * given undefined is inconsistent. Examples:
 *
 * ```js
 * JSON.stringify(null) === 'null';
 * JSON.stringify(undefined) === undefined;
 * JSON.stringify([undefined, null]) === '[null,null]';
 * JSON.stringify({a: undefined, b: null}) === '{"b":null}';
 * ```
 *
 * When serializing undefined directly `JSON.stringify()` returns undefined
 * instead of a string! When serializing an array with undefined
 * `JSON.stringify()` coerces it to null. When serializing an object property
 * `JSON.stringify()` drops undefined values altogether. This behavior makes
 * undefined unsafe to serialize with JSON.
 */
export type JSONValue =
  | null
  | boolean
  | number
  | string
  | JSONArrayValue
  | JSONObjectValue;

/**
 * A read-only JSON compatible array value.
 */
export interface JSONArrayValue extends ReadonlyArray<JSONValue> {}

/**
 * A read-only JSON compatible object value.
 */
export type JSONObjectValue = {readonly [key: string]: JSONValue};
