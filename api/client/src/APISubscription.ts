/**
 * This file defines the types for the subscription protocol between the server
 * and the client.
 *
 * Here’s a diagram of the protocol:
 *
 * ┌────────┐            ┌────────┐
 * │ Client │            │ Server │
 * └────────┘            └────────┘
 *     │                      │
 *     ├── subscribe ->       │
 *     │                      │
 *     │         <- message ──┤
 *     │         <- message ──┤
 *     │         <- message ──┤
 *     │                      │
 *     ├── unsubscribe ->     │
 *     │                      │
 *
 * Pretty standard stuff.
 *
 * The client subscribes to events on the server. When the client does this it
 * must invent a new ID which we will use for unsubscribing the subscription
 * later on.
 *
 * The server then sends the appropriate events for the subscription to the
 * client as messages. Once the client is done receiving messages it
 * may unsubscribe.
 *
 * The client may subscribe to multiple different “paths”. For example, a client
 * could subscribe to /comment/watchPostComments and /post/watchGroupPosts. The
 * client may also subscribe to the same path multiple times with different
 * inputs. The server’s message will include the “id” of the subscription.
 */

import {SchemaInput, SchemaInputValue} from "./SchemaInput";
import {APIErrorCode} from "./APIError";

/** A unique type which is used as an identifier for subscription sessions. */
export type SubscriptionID = string & {readonly _type: typeof SubscriptionID};
declare const SubscriptionID: unique symbol;

/**
 * A message sent from the client to the server in our subscription protocol.
 * This type is generated from a `SchemaInput` since it is client input sent to
 * the server which means we need to validate it.
 */
export type APISubscriptionMessageClient = SchemaInputValue<
  typeof APISubscriptionMessageClient
>;

/**
 * The input validator for an API client message from the client to the server.
 */
export const APISubscriptionMessageClient = SchemaInput.union(
  SchemaInput.object({
    type: SchemaInput.constant("subscribe"),
    id: SchemaInput.string<SubscriptionID>(),
    path: SchemaInput.string(),
    input: SchemaInput.unknown(),
  }),
  SchemaInput.object({
    type: SchemaInput.constant("unsubscribe"),
    id: SchemaInput.string<SubscriptionID>(),
  }),
);

/**
 * A message sent from the server to the client in our subscription protocol.
 */
export type APISubscriptionMessageServer =
  | {
      type: "message";
      id: SubscriptionID;
      message: unknown;
    }
  | {
      type: "error";
      error: {
        code: APIErrorCode;
        serverStack?: string;
      };
    };
