/**
 * The root URL of our API.
 */
const apiUrl = "http://localhost:4000";

/**
 * The configuration for a mutation operation. A mutation may have some
 * side-effect on the state of the world. For instance, creating a new record
 * or updating an existing record. When executed multiple times a mutation may
 * have different results. Sent over HTTP as a `POST` request.
 */
export type MutationSchema = {
  /**
   * The HTTP API path for this mutation.
   */
  readonly path: string;
  /**
   * The input object for this mutation. Submit as an HTTP body as mutations
   * correspond to `POST` requests.
   */
  readonly input: MutationSchemaData;
  /**
   * The output object for this mutation. Retrieved as the HTTP response body.
   */
  readonly output: MutationSchemaData;
};

/**
 * The configuration for a mutation’s input or output. The input is an
 * object-map from keys to `Validator`s. `MutationOperationData` gets the
 * actual input type from the schema.
 */
export type MutationSchemaData = {
  [key: string]: Validator<unknown>;
};

/**
 * A mutation operation function will actually execute the mutation operation
 * using an HTTP request.
 */
export type MutationOperation<Schema extends MutationSchema> = {
  (input: MutationOperationData<Schema["input"]>): Promise<
    MutationOperationData<Schema["output"]>
  >;
  readonly schema: Schema;
};

/**
 * The actual data type for a `MutationSchemaData`.
 */
export type MutationOperationData<Schema extends MutationSchemaData> = {
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
): MutationOperation<Schema> {
  if (schema.path.startsWith("/")) {
    throw new Error('Expected schema path to start with "/".');
  }

  /**
   * Asynchronously executes our mutation over HTTP.
   */
  async function mutationOperation(
    input: MutationOperationData<Schema["input"]>,
  ): Promise<MutationOperationData<Schema["output"]>> {
    // Execute our HTTP request...
    const response = await fetch(`${apiUrl}${schema.path}`, {
      method: "POST",
      body: JSON.stringify(input),
    });
    // Parse the body as JSON...
    const data = await response.json();
    // Return the body without validating its correctness. We trust our API
    // server to return correct values.
    return data;
  }

  // Set the schema for our mutation operation. This will be used by our server
  // to verify that we implement the operation correctly.
  mutationOperation.schema = schema;

  return mutationOperation;
}

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
