import {JSONObjectValue} from "./JSONValue";

// A private symbol used to create a phantom type.
const phantom = Symbol();

/**
 * The output of a schema method. Schema output can be an arbitrary TypeScript
 * type that can be serialized to JSON. We force the type parameter to be an
 * object so that in the future extra outputs can be added.
 *
 * We can use a plain TypeScript type since we don’t need to validate output
 * type correctness because we trust our server. We do, however, need to
 * validate input type correctness because we don’t trust our client.
 *
 * At runtime this type is the value `null`, but statically it carries around a
 * phantom type.
 */
export type SchemaOutput<Value extends JSONObjectValue> = {
  [phantom]: Value;
};

export const SchemaOutput = {
  /**
   * Creates a `SchemaOutput` phantom type.
   */
  t<Value extends JSONObjectValue>(): SchemaOutput<Value> {
    return null as any;
  },
};
