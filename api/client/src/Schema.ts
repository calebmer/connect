import {JSONObjectValue, JSONValue} from "./JSONValue";
import {SchemaInput, SchemaInputValue} from "./SchemaInput";
import {SchemaOutput} from "./SchemaOutput";

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
  namespace<Schemas extends {readonly [key: string]: SchemaBase}>(
    schemas: Schemas,
  ): SchemaNamespace<Schemas> {
    return {kind: SchemaKind.NAMESPACE, schemas};
  },

  /**
   * Creates a new schema method which requires authorization. A method
   * is the bread and butter of our RPC API as executing a method with the API
   * client will, in fact, call the method on the API server and return
   * the result.
   */
  method<
    Inputs extends {readonly [key: string]: SchemaInput<JSONValue>},
    Output extends JSONObjectValue
  >({
    input,
    output,
  }: {
    input: Inputs;
    output: SchemaOutput<Output>;
  }): SchemaMethod<
    {readonly [Key in keyof Inputs]: SchemaInputValue<Inputs[Key]>},
    Output
  > {
    return {
      kind: SchemaKind.METHOD,
      input: SchemaInput.object(input),
      output,
    };
  },

  /**
   * Creates a new schema method which does not require authorization. A method
   * is the bread and butter of our RPC API as executing a method with the API
   * client will, in fact, call the method on the API server and return
   * the result.
   */
  unauthorizedMethod<
    Inputs extends {readonly [key: string]: SchemaInput<JSONValue>},
    Output extends JSONObjectValue
  >({
    input,
    output,
  }: {
    input: Inputs;
    output: SchemaOutput<Output>;
  }): SchemaMethodUnauthorized<
    {readonly [Key in keyof Inputs]: SchemaInputValue<Inputs[Key]>},
    Output
  > {
    return {
      kind: SchemaKind.METHOD_UNAUTHORIZED,
      input: SchemaInput.object(input),
      output,
    };
  },
};

/**
 * All the different types of schemas we might have. This is the “upper bound”
 * for a schema. That is all the possible schemas we might write are an instance
 * of `SchemaBase`. However, `SchemaBase` isn’t very useful as a type since it
 * could represent anything. It’s mostly useful for constraining type
 * parameter bounds. (e.g. `<Schema extends SchemaBase>`)
 */
export type SchemaBase =
  | SchemaNamespace<{readonly [key: string]: SchemaBase}>
  | SchemaMethod<JSONObjectValue, JSONObjectValue>
  | SchemaMethodUnauthorized<JSONObjectValue, JSONObjectValue>;

/**
 * The kind of a schema.
 */
export enum SchemaKind {
  NAMESPACE,
  METHOD,
  METHOD_UNAUTHORIZED,
}

/**
 * A namespace schema is used for introducing more schemas to our API and giving
 * the schemas some nesting for better organization.
 */
export type SchemaNamespace<
  Schemas extends {readonly [key: string]: SchemaBase}
> = {
  readonly kind: SchemaKind.NAMESPACE;
  readonly schemas: Schemas;
};

/**
 * A schema method will execute a function with its typed input against our
 * API server.
 */
export type SchemaMethod<
  Input extends JSONObjectValue,
  Output extends JSONObjectValue
> = {
  readonly kind: SchemaKind.METHOD;
  readonly input: SchemaInput<Input>;
  readonly output: SchemaOutput<Output>;
};

/**
 * A schema method will execute a function with its typed input against our
 * API server. An unauthorized method does not need an account to be signed in
 * to run.
 */
export type SchemaMethodUnauthorized<
  Input extends JSONObjectValue,
  Output extends JSONObjectValue
> = {
  readonly kind: SchemaKind.METHOD_UNAUTHORIZED;
  readonly input: SchemaInput<Input>;
  readonly output: SchemaOutput<Output>;
};
