/**
 * A read-only JSON compatible value.
 *
 * Useful as an upper-bound for further refining a type which we expect to be
 * JSON compatible.
 */
export type JSONValue =
  | null
  | undefined
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
