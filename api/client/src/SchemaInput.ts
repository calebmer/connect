import {JSONValue} from "./JSONValue";

/**
 * Validates that some input to our API is in the correct format.
 */
export class SchemaInput<Value extends JSONValue> {
  /**
   * Returns true if the value is indeed a value expected by this `SchemaInput`.
   */
  readonly validate: (value: unknown) => value is Value;

  private constructor(validate: (value: unknown) => value is Value) {
    this.validate = validate;
  }

  /**
   * Accepts only boolean values.
   */
  static boolean = new SchemaInput<boolean>(
    (value): value is boolean => typeof value === "boolean",
  );

  /**
   * Accepts only number values.
   */
  static number = new SchemaInput<number>(
    (value): value is number => typeof value === "number",
  );

  /**
   * Accepts only string values.
   */
  static string = new SchemaInput<string>(
    (value): value is string => typeof value === "string",
  );

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
   * If the object value has extra keys we ignore them. This is the same as how
   * TypeScript object type checking works.
   */
  static object<
    Inputs extends {readonly [key: string]: SchemaInput<JSONValue>}
  >(
    inputs: Inputs,
  ): SchemaInput<{[Key in keyof Inputs]: SchemaInputValue<Inputs[Key]>}> {
    return new SchemaInput(
      (value): value is any => {
        if (typeof value !== "object") return false;
        if (value === null) return false;
        if (Array.isArray(value)) return false;
        for (const [key, input] of Object.entries(inputs)) {
          if (!input.validate((value as any)[key])) return false;
        }
        return true;
      },
    );
  }
}

/**
 * Gets the value from a `SchemaInput`.
 */
export type SchemaInputValue<
  Type extends SchemaInput<JSONValue>
> = Type extends SchemaInput<infer Value> ? Value : never;
