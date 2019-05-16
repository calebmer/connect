/**
 * This module is responsible for binding our API definitions to the WebSocket
 * protocol. We do this for subscription API endpoints. Currently subscriptions
 * are mostly one-way realtime events even though WebSockets allow for
 * bi-directional communication.
 *
 * Includes a custom router and the protocol for subscribing to any given
 * subscription endpoint.
 */

// NOTE: These two modules are installed to make the `ws` module faster. By
// importing them here we can be totally certain that they exist and will be
// used by the `ws` module.
import "bufferutil";
import "utf-8-validate";

import {
  APIError,
  APIErrorCode,
  JSONObjectValue,
  JSONValue,
  SchemaSubscription,
  SubscriptionID,
  SubscriptionMessageClient,
  SubscriptionMessageServer,
} from "@connect/api-client";
import {AccessTokenData, AccessTokenGenerator} from "./AccessToken";
import {ContextSubscription} from "./Context";
import {ServerSubscription} from "./Server";
import WebSocket from "ws";
import http from "http";
import {logError} from "./logError";
import {parse as parseURL} from "url";

/**
 * The type of our WebSocket server which comes with some extra properties.
 */
export type ServerWS = WebSocket.Server & {
  router: Map<
    string,
    {
      definition: ServerSubscription<JSONObjectValue, JSONObjectValue>;
      schema: SchemaSubscription<JSONObjectValue, JSONObjectValue>;
    }
  >;
};

/**
 * Create a new WebSocket server that is capable of handling new connections,
 * routing, and authentication.
 */
function create(server: http.Server): ServerWS {
  const serverWS = Object.assign(
    new WebSocket.Server({
      server,

      // Verify the client has a valid access token and set the access token
      // on the request object if we do have a valid access token.
      verifyClient({req}, callback) {
        verifyClient(req).then(
          accessToken => {
            (req as any).accessToken = accessToken;
            callback(true);
          },
          error => callback(false, APIError.statusCode(error)),
        );
      },
    }),
    {
      router: new Map(),
    },
  );

  // Handle all new connections to the WebSocket server...
  serverWS.on("connection", (socket, req) => {
    handleConnection(serverWS, socket, req);
  });

  return serverWS;
}

/**
 * Initializes the websocket server with a subscription.
 */
function initializeSubscription<
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
 * Parse the access token from an incoming HTTP request and verify that the
 * access token was generated by our API.
 */
async function verifyClient(
  req: http.IncomingMessage,
): Promise<AccessTokenData> {
  // Get the access token from the request URL.
  const accessToken = parseURL(req.url!, true).query.access_token;
  if (typeof accessToken !== "string") {
    throw new APIError(APIErrorCode.UNAUTHORIZED);
  }

  // Verify and parse the access token. If we fail to do so then this function
  // will throw an `APIError`.
  return await AccessTokenGenerator.verify(accessToken);
}

/**
 * Handles a brand new connection with a client of our web socket server.
 */
function handleConnection(
  server: ServerWS,
  socket: WebSocket,
  req: http.IncomingMessage,
): void {
  // In order for us to get here the call to `verifyClient()` must succeed and
  // `verifyClient()` requires an access token.
  const accessToken: AccessTokenData = (req as any).accessToken;

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
        const subscriptionRoute = server.router.get(message.path);
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
    const ctx = new ContextSubscription<Message>(accessToken.id, message => {
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

    // Once we’ve successfully subscribed, let the client know by publishing
    // a message. It may take us some time to subscribe to the service so we
    // need to let the client know when they are actually online.
    publish({type: "subscribed", id});
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
function detectBrokenConnections(server: WebSocket.Server) {
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

export const ServerWS = {
  create,
  initializeSubscription,
  detectBrokenConnections,
};
