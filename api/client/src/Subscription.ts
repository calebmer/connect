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
export type SubscriptionMessageClient = SchemaInputValue<
  typeof SubscriptionMessageClient
>;

/**
 * The input validator for an API client message from the client to the server.
 */
export const SubscriptionMessageClient = SchemaInput.union(
  /**
   * Subscribe to a given subscription path with some input. We can subscribe
   * to the same path multiple times as long as we use a different ID.
   */
  SchemaInput.object({
    type: SchemaInput.constant("Subscribe"),
    id: SchemaInput.string<SubscriptionID>(),
    path: SchemaInput.string(),
    input: SchemaInput.unknown(),
  }),

  /**
   * Unsubscribe from a subscription that we previously setup.
   */
  SchemaInput.object({
    type: SchemaInput.constant("Unsubscribe"),
    id: SchemaInput.string<SubscriptionID>(),
  }),
);

/**
 * A message sent from the server to the client in our subscription protocol.
 */
export type SubscriptionMessageServer =
  /**
   * Our `subscribe` message was successful! We can now expect to receive all
   * the events from the stream we subscribed to.
   */
  | {
      readonly type: "Subscribed";
      readonly id: SubscriptionID;
    }

  /**
   * A new message from one of our subscriptions. We know which subscription
   * since we’re provided with the ID.
   */
  | {
      readonly type: "Message";
      readonly id: SubscriptionID;
      readonly message: unknown;
    }

  /**
   * Some error ocurred.
   */
  | {
      readonly type: "Error";
      readonly error: {
        readonly code: APIErrorCode;
        readonly serverStack?: string;
      };
    }

  /**
   * We may add a new event type at any point. This case helps force us to deal
   * with that eventuality in the types.
   */
  | {readonly type: never}; // NOTE: Ideally this would be: `string & not SubscriptionMessageServerType`.
