import {JSONObjectValue, JSONValue} from "./JSONValue";

/**
 * Validates that some input to our API is in the correct format.
 */
export class SchemaInput<Value extends JSONValue> {
  /**
   * Returns true if the value is indeed a value expected by this `SchemaInput`.
   */
  readonly validate: (value: JSONValue) => value is Value;

  /** An optional variant of this `SchemaInput`. */
  private _optional: SchemaInput<Value | null> | undefined = undefined;

  constructor(validate: (value: JSONValue) => value is Value) {
    this.validate = validate;
  }

  private static _boolean = new SchemaInput<boolean>(
    (value): value is boolean => typeof value === "boolean",
  );

  private static _number = new SchemaInput<number>(
    (value): value is number => typeof value === "number",
  );

  private static _integer = new SchemaInput<number>(
    (value): value is number =>
      typeof value === "number" && Number.isInteger(value),
  );

  private static _string = new SchemaInput<string>(
    (value): value is string => typeof value === "string",
  );

  private static _unknown = new SchemaInput<JSONValue>(
    (_value): _value is JSONValue => true,
  );

  /**
   * Accepts only boolean values.
   */
  static boolean(): SchemaInput<boolean> {
    return this._boolean;
  }

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
   * Accepts only integer values.
   *
   * Allows the caller to pass a type argument to treat the input as some kind
   * of special type.
   */
  static integer<Value extends number>(): SchemaInput<Value> {
    return this._integer as SchemaInput<Value>;
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
   * Any JSON value.
   */
  static unknown(): SchemaInput<JSONValue> {
    return this._unknown;
  }

  /**
   * Accepts only one of the specified values.
   */
  static enum<Value extends JSONValue>(
    values: ReadonlyArray<Value>,
  ): SchemaInput<Value> {
    const valueSet = new Set(values);
    return new SchemaInput<Value>(
      (value): value is Value => valueSet.has(value as any),
    );
  }

  /**
   * Accepts only a literal value exactly equal to the provided value.
   */
  static constant<Value extends JSONValue>(value: Value): SchemaInput<Value> {
    return new SchemaInput<Value>(
      (otherValue): otherValue is Value => otherValue === value,
    );
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
    return new SchemaInputArray(input);
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
  ): SchemaInputObject<{[Key in keyof Inputs]: SchemaInputValue<Inputs[Key]>}> {
    return new SchemaInputObject(inputs) as any;
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

  /**
   * If any of the provided schemas match then we validate the value. In the
   * worst case we will do a linear search through all the possible schemas.
   *
   * **NOTE:** We might be able to use a “sentinel” property like `type: "foo"`
   * to optimize this from O(n) to O(1). This would improve the performance of
   * large tagged unions.
   *
   * **NOTE:** The type signature is written a little awkwardly to infer the
   * correct type which is a union of all the array elements.
   */
  static union<Schemas extends Array<SchemaInput<JSONValue>>>(
    ...schemas: Schemas
  ): SchemaInput<SchemaInputValue<Schemas[number]>> {
    return new SchemaInput(
      (value): value is any => {
        for (let i = 0; i < schemas.length; i++) {
          if (schemas[i].validate(value)) return true;
        }
        return false;
      },
    );
  }
}

/** Gets the value from a `SchemaInput` type. */
export type SchemaInputValue<
  Type extends SchemaInput<JSONValue>
> = Type extends SchemaInput<infer Value> ? Value : never;

/**
 * A `SchemaInput` type specifically for arrays.
 */
export class SchemaInputArray<Value extends JSONValue> extends SchemaInput<
  ReadonlyArray<Value>
> {
  constructor(input: SchemaInput<Value>) {
    super(
      (value): value is any => {
        if (!Array.isArray(value)) return false;
        for (let i = 0; i < value.length; i++) {
          if (!input.validate(value[i])) return false;
        }
        return true;
      },
    );
  }
}

/**
 * A `SchemaInput` type specifically for objects.
 */
export class SchemaInputObject<
  Value extends JSONObjectValue
> extends SchemaInput<Value> {
  constructor(
    /**
     * The input schemas for each of our object schema’s properties.
     */
    public readonly inputs: {
      readonly [Key in keyof Value]: SchemaInput<Value[Key]>
    },
  ) {
    super(
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
}
