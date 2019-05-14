/**
 * This module is responsible for binding our API definitions to the WebSocket
 * protocol. We do this for subscription API endpoints. Currently subscriptions
 * are mostly one-way realtime events even though WebSockets allow for
 * bi-directional communication.
 *
 * Includes a custom router and the protocol for subscribing to any given
 * subscription endpoint.
 */

import {
  APIError,
  APIErrorCode,
  AccountID,
  JSONObjectValue,
  JSONValue,
  SchemaSubscription,
  SubscriptionID,
  SubscriptionMessageClient,
  SubscriptionMessageServer,
} from "@connect/api-client";
import {ContextSubscription} from "./Context";
import {ServerSubscription} from "./Server";
import WebSocket from "ws";
import {logError} from "./logError";

/**
 * Initializes a WebSocket server.
 */
export function initializeServerEventHandlers(server: WebSocket.Server) {
  server.on("connection", socket => handleConnection(server, socket));
}

/**
 * Initializes the websocket server with a subscription.
 */
export function initializeServerSubscription<
  Input extends JSONObjectValue,
  Message extends JSONObjectValue
>(
  server: WebSocket.Server,
  path: ReadonlyArray<string>,
  definition: ServerSubscription<Input, Message>,
  schema: SchemaSubscription<Input, Message>,
): void {
  if (!(server as any).router) {
    (server as any).router = new Map();
  }

  // Create a map with all the subscription paths so that when a connected
  // client subscribes to one of them we will know what behavior to use.
  (server as any).router.set(`/${path.join("/")}`, {
    definition,
    schema,
  } as any);
}

/**
 * Handles a brand new connection with a client of our web socket server.
 */
function handleConnection(server: WebSocket.Server, socket: WebSocket): void {
  /**
   * All of the subscriptions that are currently active for our socket. We will
   * clean these up when the socket closes.
   */
  const subscriptions = new Map<SubscriptionID, Promise<() => Promise<void>>>();

  // Whenever we receive a pong for our socket, we know that the socket is
  // still alive.
  (socket as any).isAlive = true;
  socket.on("pong", () => {
    (socket as any).isAlive = true;
  });

  // Report any socket errors to stderr.
  socket.on("error", error => logError(error));

  // When the socket closes we want to unsubscribe from all of our
  // subscriptions! Otherwise we have a memory leak.
  socket.on("close", () => {
    // Unsubscribe from all of our subscriptions in parallel.
    for (const unsubscribe of subscriptions.values()) {
      unsubscribe
        .then(unsubscribe => unsubscribe())
        .catch(error => logError(error));
    }
    // Immediately clear the subscriptions map since we’ve closed the socket
    // and there should be no more subscriptions.
    subscriptions.clear();
  });

  // Subscribe to all the messages from our client. Remember that any errors
  // thrown by our message handler will be caught and dealt with.
  socket.on("message", async rawMessage => {
    try {
      // We only support string web socket messages. We do not currently
      // support binary messages.
      if (typeof rawMessage !== "string") {
        throw new APIError(APIErrorCode.BAD_INPUT);
      }

      // The message must be a JSON string. If the message is not a JSON
      // string then throw a bad input error.
      let message: JSONValue;
      try {
        message = JSON.parse(rawMessage);
      } catch (error) {
        throw new APIError(APIErrorCode.BAD_INPUT);
      }

      // Validate that the message, which is user input, is indeed a
      // subscription message! We can’t trust the message to be valid since
      // the user could give us any arbitrary JSON value.
      if (!SubscriptionMessageClient.validate(message)) {
        throw new APIError(APIErrorCode.BAD_INPUT);
      }

      // Finally, handle the message. It returns a promise so we want to await
      // that in case it throws an error.
      await handleMessage(message);
    } catch (error) {
      // If this was not an unexpected error then log it to the console.
      if (!(error instanceof APIError)) {
        logError(error);
      }
      // Always report our errors back to the user.
      publish({
        type: "error",
        error: APIError.toJSON(error),
      });
    }
  });

  /**
   * Handles an incoming message from our client.
   */
  async function handleMessage(message: SubscriptionMessageClient) {
    switch (message.type) {
      case "subscribe": {
        const subscriptionRoute = (server as any).router.get(message.path);
        if (subscriptionRoute === undefined) {
          throw new APIError(APIErrorCode.NOT_FOUND);
        }
        return await handleSubscribe(
          subscriptionRoute.definition,
          subscriptionRoute.schema,
          message.id,
          message.input,
        );
      }
      case "unsubscribe": {
        return await handleUnsubscribe(message.id);
      }
      default:
        throw new Error(`Unexpected message "${message["type"]}"`);
    }
  }

  /**
   * Handles an incoming subscription message from our client.
   */
  async function handleSubscribe<
    Input extends JSONObjectValue,
    Message extends JSONObjectValue
  >(
    definition: ServerSubscription<Input, Message>,
    schema: SchemaSubscription<Input, Message>,
    id: SubscriptionID,
    input: JSONValue,
  ) {
    // We require the ID for this subscription to be unique for the client’s
    // session. So throw an error if it is not unique.
    if (subscriptions.has(id)) {
      throw new APIError(APIErrorCode.ALREADY_EXISTS);
    }

    // Check to make sure that the user-provided input is valid input for our
    // subscription schema.
    if (!schema.input.validate(input)) {
      throw new APIError(APIErrorCode.BAD_INPUT);
    }

    // Create the context for our subscription. When we publish to our
    // subscription we will, in turn, publish to our client using the ID they
    // gave us so the client knows the exact subscription the new message
    // is for.
    //
    // TODO: Somehow provide an actual account ID!
    const ctx = new ContextSubscription<Message>(42 as AccountID, message => {
      publish({type: "message", id, message});
    });

    // Setup our subscription! Store the unsubscribe function for later usage.
    //
    // IMPORTANT: We need to set our subscription in the map synchronously so
    // that if another subscription with the same ID comes in we can error. The
    // promise we store in the map won’t throw an error.
    const unsubscribe = definition(ctx, input);
    subscriptions.set(id, unsubscribe.catch(() => async () => {}));
    await unsubscribe;
  }

  /**
   * Handles the client unsubscribing from a previous subscription it set up.
   */
  async function handleUnsubscribe(id: SubscriptionID) {
    const unsubscribe = subscriptions.get(id);

    // Cannot unsubscribe from a subscription that was never started.
    if (unsubscribe === undefined) {
      throw new APIError(APIErrorCode.NOT_FOUND);
    }

    // Delete the subscription from the map so we don’t unsubscribe again when
    // the socket closes.
    subscriptions.delete(id);

    // Call the unsubscribe function.
    await unsubscribe.then(unsubscribe => unsubscribe());
  }

  /**
   * Publishes a message to our API client.
   */
  function publish(message: SubscriptionMessageServer) {
    socket.send(JSON.stringify(message));
  }
}

/**
 * Detects and terminates broken connections. We do this by sending a ping. If
 * we haven’t received a pong back by the time this runs again then we assume
 * the socket is broken and terminate it.
 */
export function detectBrokenConnections(server: WebSocket.Server) {
  server.clients.forEach(socket => {
    // If the socket is not alive then terminate it. We should get a pong
    // request back which will mark our socket as alive.
    if ((socket as any).isAlive === false) {
      socket.terminate();
      return;
    }

    // Ping our socket. Once we get a pong back we can mark this client
    // as alive.
    (socket as any).isAlive = false;
    socket.ping();
  });
}
