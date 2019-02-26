/**
 * The configuration for a mutation operation. A mutation may have some
 * side-effect on the state of the world. For instance, creating a new record
 * or updating an existing record. When executed multiple times a mutation may
 * have different results. Sent over HTTP as a `POST` request.
 */
type MutationSchema = {
  /**
   * The HTTP API path for this mutation.
   */
  readonly path: string;
  /**
   * The input object for this mutation. Submit as an HTTP body as mutations
   * correspond to `POST` requests.
   */
  readonly input: MutationSchemaInput;
};

/**
 * The configuration for a mutation’s input. The input is an object-map from
 * keys to `Validator`s. `MutationOperationInput` gets the actual input type
 * from the schema.
 */
type MutationSchemaInput = {
  [key: string]: Validator<unknown>;
};

/**
 * A mutation operation function will actually execute the mutation operation
 * using an HTTP request.
 */
type MutationOperation<Schema extends MutationSchema> = {
  (input: MutationOperationInput<Schema["input"]>): Promise<void>;
  readonly schema: Schema;
};

/**
 * The actual input type for a `MutationSchemaInput`.
 */
type MutationOperationInput<Schema extends MutationSchemaInput> = {
  [Key in keyof Schema]: ValidatorValue<Schema[Key]>
};

/**
 * Creates a mutation operation. A mutation may have some
 * side-effect on the state of the world. For instance, creating a new record
 * or updating an existing record. When executed multiple times a mutation may
 * have different results. Sent over HTTP as a `POST` request.
 */
export function createMutation<Schema extends MutationSchema>(
  schema: Schema,
): MutationOperation<Schema> {}

/**
 * Validates that an unknown JavaScript value is of a certain TypeScript type.
 */
export type Validator<Value> = {
  validate(value: unknown): value is Value;
};

/**
 * Gets the value type for a `Validator`.
 */
export type ValidatorValue<Type> = Type extends Validator<infer Value>
  ? Value
  : never;

/**
 * Validates that a value is a string value.
 */
export const string: Validator<string> = {
  validate(value: unknown): value is string {
    return typeof value === "string";
  },
};
