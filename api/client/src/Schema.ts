import {JSONObjectValue, JSONValue} from "./JSONValue";
import {SchemaInput, SchemaInputObject, SchemaInputValue} from "./SchemaInput";
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
    Safe extends boolean,
    Inputs extends {readonly [key: string]: SchemaInput<JSONValue>},
    Output extends JSONObjectValue
  >({
    safe,
    input,
    output,
  }: {
    safe: Safe;
    input: Inputs;
    output: SchemaOutput<Output>;
  }): SchemaMethod<
    {readonly [Key in keyof Inputs]: SchemaInputValue<Inputs[Key]>},
    Output,
    Safe
  > {
    return {
      kind: SchemaKind.METHOD,
      safe,
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
    Safe extends boolean,
    Inputs extends {readonly [key: string]: SchemaInput<JSONValue>},
    Output extends JSONObjectValue
  >({
    safe,
    input,
    output,
  }: {
    safe: Safe;
    input: Inputs;
    output: SchemaOutput<Output>;
  }): SchemaMethodUnauthorized<
    {readonly [Key in keyof Inputs]: SchemaInputValue<Inputs[Key]>},
    Output,
    Safe
  > {
    return {
      kind: SchemaKind.METHOD_UNAUTHORIZED,
      safe,
      input: SchemaInput.object(input),
      output,
    };
  },

  /**
   * Creates a new schema subscription. A subscription provides the ability for
   * the client to receive messages in realtime.
   */
  subscription<
    Inputs extends {readonly [key: string]: SchemaInput<JSONValue>},
    Message extends JSONObjectValue & {type: string}
  >({
    input,
    message,
  }: {
    input: Inputs;
    message: SchemaOutput<Message>;
  }): SchemaSubscription<
    {readonly [Key in keyof Inputs]: SchemaInputValue<Inputs[Key]>},
    Message
  > {
    return {
      kind: SchemaKind.SUBSCRIPTION,
      input: SchemaInput.object(input),
      message,
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
  | SchemaMethodUnauthorized<JSONObjectValue, JSONObjectValue>
  | SchemaSubscription<JSONObjectValue, JSONObjectValue & {type: string}>;

/**
 * The kind of a schema.
 */
export enum SchemaKind {
  NAMESPACE,
  METHOD,
  METHOD_UNAUTHORIZED,
  SUBSCRIPTION,
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
  Output extends JSONObjectValue,
  Safe extends boolean = boolean
> = {
  readonly kind: SchemaKind.METHOD;
  readonly safe: Safe;
  readonly input: SchemaInputObject<Input>;
  readonly output: SchemaOutput<Output>;
};

/**
 * A schema method will execute a function with its typed input against our
 * API server. An unauthorized method does not need an account to be signed in
 * to run.
 */
export type SchemaMethodUnauthorized<
  Input extends JSONObjectValue,
  Output extends JSONObjectValue,
  Safe extends boolean = boolean
> = {
  readonly kind: SchemaKind.METHOD_UNAUTHORIZED;
  readonly safe: Safe;
  readonly input: SchemaInputObject<Input>;
  readonly output: SchemaOutput<Output>;
};

/**
 * A schema subscription provides the ability to send real time events between
 * the client and server. The input is used when establishing a connection to
 * determine which, specific, events will be sent to our client.
 *
 * Can be implemented as either WebSockets or Server-sent events since a
 * subscription is intentionally not bi-directional.
 *
 * The message type is forced to be a tagged union because we will often mix
 * messages with other events.
 */
export type SchemaSubscription<
  Input extends JSONObjectValue,
  Message extends JSONObjectValue & {type: string}
> = {
  readonly kind: SchemaKind.SUBSCRIPTION;
  readonly input: SchemaInputObject<Input>;
  readonly message: SchemaOutput<Message>;
};
