import * as _APIServerDefinition from "./def";
import {
  APISchema,
  SchemaBase,
  SchemaKind,
  SchemaNamespace,
} from "@connect/api-client";
import {Server, ServerNamespace} from "./Server";
import express, {Express} from "express";
import {ServerHTTP} from "./ServerHTTP";
import {ServerWS} from "./ServerWS";
import WebSocket from "ws";
import http from "http";

/**
 * The definition of all our API server methods. The method implementations live
 * in the `./methods` folder. Here we combine all the methods together and
 * verify that they have the correct type.
 *
 * NOTE: If this variable fails to type check then that means one of our API
 * method implementations has an incorrect type!
 */
const APIServerDefinition: Server<typeof APISchema> = _APIServerDefinition;

/**
 * Initializes and starts our API server on the provided port.
 */
function startServer(port: number, callback: () => void) {
  // Create our server objects...
  const serverHTTP = express();
  const server = http.createServer(serverHTTP);
  const serverWS = ServerWS.create(server);

  /// Initialize our server objects...
  ServerHTTP.initializeMiddlewareBefore(serverHTTP);
  initializeServer(serverHTTP, serverWS, [], APIServerDefinition, APISchema);
  ServerHTTP.initializeMiddlewareAfter(serverHTTP);

  // Every 30 seconds, ping all of our web socket clients. If a client doesn’t
  // send a “pong” back then the next time we try to ping that client we will
  // instead terminate the client.
  setInterval(() => {
    ServerWS.detectBrokenConnections(serverWS);
  }, 30 * 1000);

  // Start listening to our API server on the right port!
  server.listen(port, callback);
}

export const APIServer = {
  start: startServer,
};

/**
 * Initializes the server with any kind of API schema.
 */
function initializeServer(
  serverHTTP: Express,
  serverWS: WebSocket.Server,
  path: Array<string>,
  definition: Server<SchemaBase>,
  schema: SchemaBase,
): void {
  switch (schema.kind) {
    case SchemaKind.NAMESPACE:
      return initializeServerNamespace(
        serverHTTP,
        serverWS,
        path,
        definition as any,
        schema,
      );
    case SchemaKind.METHOD:
      return ServerHTTP.initializeMethod(
        serverHTTP,
        path,
        definition as any,
        schema,
      );
    case SchemaKind.METHOD_UNAUTHORIZED:
      return ServerHTTP.initializeMethodUnauthorized(
        serverHTTP,
        path,
        definition as any,
        schema,
      );
    case SchemaKind.SUBSCRIPTION:
      return ServerWS.initializeSubscription(
        serverWS,
        path,
        definition as any,
        schema,
      );
    default: {
      const never: never = schema;
      return never;
    }
  }
}

/**
 * Initializes the server with a schema namespace by adding the namespace name
 * to the path stack.
 */
function initializeServerNamespace<
  Schemas extends {readonly [key: string]: SchemaBase}
>(
  serverHTTP: Express,
  serverWS: WebSocket.Server,
  path: Array<string>,
  definition: ServerNamespace<Schemas>,
  namespaceSchema: SchemaNamespace<Schemas>,
): void {
  // Loop through all the entries in our namespace and add their schema to
  // our client.
  for (const [key, schema] of Object.entries(namespaceSchema.schemas)) {
    path.push(key);
    initializeServer(serverHTTP, serverWS, path, definition[key], schema);
    path.pop();
  }
}
