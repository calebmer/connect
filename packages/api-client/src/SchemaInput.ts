import {JSONValue} from "./JSONValue";

export class SchemaInput<Value extends JSONValue> {
  readonly validate: (value: unknown) => value is Value;

  private constructor(validate: (value: unknown) => value is Value) {
    this.validate = validate;
  }

  static boolean = new SchemaInput<boolean>(
    (value): value is boolean => typeof value === "boolean",
  );

  static number = new SchemaInput<number>(
    (value): value is number => typeof value === "number",
  );

  static string = new SchemaInput<string>(
    (value): value is string => typeof value === "string",
  );

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

export type SchemaInputValue<
  Type extends SchemaInput<JSONValue>
> = Type extends SchemaInput<infer Value> ? Value : never;
