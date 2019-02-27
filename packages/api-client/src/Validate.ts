/**
 * Validates that an unknown JavaScript value is of a certain TypeScript type.
 */
export type Validator<Value> = (value: unknown) => value is Value;

/**
 * Gets the value type for a `Validator`.
 */
export type ValidatorValue<Type> = Type extends Validator<infer Value>
  ? Value
  : never;

/**
 * Validates that a value is a string value.
 */
export function string(value: unknown): value is string {
  return typeof value === "string";
}

/**
 * Checks to see if an object matches the provided validator. We check to make
 * sure that all of the keys in `validators` have an entry in `value` which
 * passes the validator for that key.
 *
 * We don’t check to see if `value` has any _extra_ properties not in
 * `validators`. Extra properties will be ignored. Just like in TypeScript.
 */
export function validateObject<
  Validators extends {[key: string]: Validator<unknown>}
>(
  validators: Validators,
  value: unknown,
): value is {[Key in keyof Validators]: ValidatorValue<Validators[Key]>} {
  if (typeof value === "object" && value !== null && !Array.isArray(value)) {
    for (const [key, validator] of Object.entries(validators)) {
      if (!validator((value as {[key: string]: unknown})[key])) return false;
    }
    return true;
  } else {
    return false;
  }
}
