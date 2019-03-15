import {JSONValue} from "./JSONValue";

/**
 * Validates that some input to our API is in the correct format.
 */
export class SchemaInput<Value extends JSONValue> {
  /**
   * Returns true if the value is indeed a value expected by this `SchemaInput`.
   */
  readonly validate: (value: unknown) => value is Value;

  /** An optional variant of this `SchemaInput`. */
  private _optional: SchemaInput<Value | null> | undefined = undefined;

  private constructor(validate: (value: unknown) => value is Value) {
    this.validate = validate;
  }

  /**
   * Accepts only boolean values.
   */
  static boolean = new SchemaInput<boolean>(
    (value): value is boolean => typeof value === "boolean",
  );

  private static _number = new SchemaInput<number>(
    (value): value is number => typeof value === "number",
  );

  private static _string = new SchemaInput<string>(
    (value): value is string => typeof value === "string",
  );

  /**
   * Accepts only number values.
   *
   * Allows the caller to pass a type argument to treat the input as some kind
   * of special type.
   */
  static number<Value extends number>(): SchemaInput<Value> {
    return this._number as SchemaInput<Value>;
  }

  /**
   * Accepts only string values.
   *
   * Allows the caller to pass a type argument to treat the input as some kind
   * of special type.
   */
  static string<Value extends string>(): SchemaInput<Value> {
    return this._string as SchemaInput<Value>;
  }

  /**
   * Accepts only array values where each array element passes the
   * provided `SchemaInput`.
   *
   * We check _every single item_ when validating an array value. Even if that
   * array is really long. While expensive, we don’t trust user input to our API
   * so we want to verify we got the correct input.
   */
  static array<Value extends JSONValue>(
    input: SchemaInput<Value>,
  ): SchemaInput<ReadonlyArray<Value>> {
    return new SchemaInput(
      (value): value is any => {
        if (!Array.isArray(value)) return false;
        for (let i = 0; i < value.length; i++) {
          if (!input.validate(value)) return false;
        }
        return true;
      },
    );
  }

  /**
   * Accepts only object values that have matching keys with values that pass
   * the provided `SchemaInput` for that key.
   *
   * If the object value has extra keys then we fail validation because of
   * security concerns. Our code may be written to not expect extra properties
   * so extra properties are an injection vector.
   */
  static object<
    Inputs extends {readonly [key: string]: SchemaInput<JSONValue>}
  >(
    inputs: Inputs,
  ): SchemaInput<{[Key in keyof Inputs]: SchemaInputValue<Inputs[Key]>}> {
    return new SchemaInput(
      (value): value is any => {
        // Make sure the value is an object but not an array.
        if (typeof value !== "object") return false;
        if (value === null) return false;
        if (Array.isArray(value)) return false;

        // Check to make sure that all of our inputs have a valid object key.
        for (const [key, input] of Object.entries(inputs)) {
          if (!input.validate((value as any)[key])) return false;
        }

        // If the value has a property that does not exist in our inputs then
        // fail the validation.
        for (const key of Object.keys(value)) {
          if (inputs[key] === undefined) return false;
        }

        return true;
      },
    );
  }

  /**
   * Gets an optional variant of this schema input where we may have either the
   * `Value` or `null`.
   *
   * **NOTE:** Optional intentionally uses `null` instead of `undefined`. JSON
   * does not have a representation for `undefined` so its behavior is
   * inconsistent. See `JSONValue` for more information.
   */
  optional(): SchemaInput<Value | null> {
    if (this._optional === undefined) {
      const schema = new SchemaInput<Value | null>(
        (value): value is Value | null =>
          value === null || this.validate(value),
      );
      schema._optional = schema;
      this._optional = schema;
    }
    return this._optional;
  }
}

/** Gets the value from a `SchemaInput` type. */
export type SchemaInputValue<
  Type extends SchemaInput<JSONValue>
> = Type extends SchemaInput<infer Value> ? Value : never;
