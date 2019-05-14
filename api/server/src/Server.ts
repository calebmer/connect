import {Context, ContextSubscription, ContextUnauthorized} from "./Context";
import {
  SchemaBase,
  SchemaMethod,
  SchemaMethodUnauthorized,
  SchemaNamespace,
  SchemaSubscription,
} from "@connect/api-client";

/**
 * Creates the type for an API server definition based on the API schema.
 */
export type Server<
  Schema extends SchemaBase
> = Schema extends SchemaNamespace<infer Schemas> // prettier-ignore
  ? ServerNamespace<Schemas>
  : Schema extends SchemaMethod<infer Input, infer Output>
  ? ServerMethod<Input, Output>
  : Schema extends SchemaMethodUnauthorized<infer Input, infer Output>
  ? ServerMethodUnauthorized<Input, Output>
  : Schema extends SchemaSubscription<infer Input, infer Message>
  ? ServerSubscription<Input, Message>
  : never;

/**
 * Creates the type of a namespace for the API server.
 */
export type ServerNamespace<
  Schemas extends {readonly [key: string]: SchemaBase}
> = {readonly [Key in keyof Schemas]: Server<Schemas[Key]>};

/**
 * The type of a server-side definition for an authorized method. It takes the
 * method input and some authorized context.
 */
export type ServerMethod<Input, Output> = (
  ctx: Context,
  input: Input,
) => Promise<Output>;

/**
 * The type of a server-side definition for an unauthorized method. It takes the
 * method input and some unauthorized context.
 */
export type ServerMethodUnauthorized<Input, Output> = (
  ctx: ContextUnauthorized,
  input: Input,
) => Promise<Output>;

/**
 * The type of a server-side definition for a subscription. It takes some input
 * and asynchronously establishes a subscription. To publish messages call
 * `ContextSubscription.publish`. Once it’s time to unsubscribe we call the
 * function returned by the subscription which will clean up the subscription.
 */
export type ServerSubscription<Input, Message> = (
  ctx: ContextSubscription<Message>,
  input: Input,
) => Promise<() => Promise<void>>;
