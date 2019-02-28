import {JSONValue, JSONObjectValue} from "./JSONValue";
import {SchemaInput, SchemaInputValue} from "./SchemaInput";

/**
 * A framework for creating an HTTP RPC based API schema.
 *
 * Using these methods we can define a schema which both an API client and an
 * API server can be generated. Well, more realistically, an API client can be
 * generated and an API server will be defined based on the schema definition.
 */
export const Schema = {
  /**
   * Creates a new schema namespace. The namespace will contain some other
   * schemas. Namespaces allow for organization of the API.
   */
  namespace<Schemas extends {readonly [key: string]: Schema}>(
    schemas: Schemas,
  ): SchemaNamespace<Schemas> {
    return {kind: SchemaKind.NAMESPACE, schemas};
  },

  /**
   * Creates a new schema method which does not require authorization. A method
   * is the bread and butter of our RPC API as executing a method with the API
   * client will, in fact, call the method on the API server and return
   * the result.
   */
  unauthorizedMethod<
    Inputs extends {readonly [key: string]: SchemaInput<JSONValue>}
  >(
    inputs: Inputs,
  ): SchemaMethodUnauthorized<
    {[Key in keyof Inputs]: SchemaInputValue<Inputs[Key]>}
  > {
    const input = SchemaInput.object(inputs);
    return {kind: SchemaKind.METHOD_UNAUTHORIZED, input};
  },
};

/**
 * All the different types of schemas we might have.
 */
export type Schema =
  | SchemaNamespace<{readonly [key: string]: Schema}>
  | SchemaMethodUnauthorized<JSONObjectValue>;

/**
 * The kind of a schema.
 */
export enum SchemaKind {
  NAMESPACE,
  METHOD_UNAUTHORIZED,
}

/**
 * A namespace schema is used for introducing more schemas to our API and giving
 * the schemas some nesting for better organization.
 */
export type SchemaNamespace<
  Schemas extends {readonly [key: string]: Schema}
> = {
  readonly kind: SchemaKind.NAMESPACE;
  readonly schemas: Schemas;
};

/**
 * A schema method will execute a method with its typed input against our
 * API server.
 */
export type SchemaMethodUnauthorized<
  MethodInputValue extends JSONObjectValue
> = {
  readonly kind: SchemaKind.METHOD_UNAUTHORIZED;
  readonly input: SchemaInput<MethodInputValue>;
};
