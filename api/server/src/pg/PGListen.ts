import {Client} from "pg";
import {JSONValue} from "@connect/api-client";
import {PGClient} from "./PGClient";
import {TEST} from "../RunConfig";
import createDebugger from "debug";
import {logError} from "../logError";
import {sql} from "./SQL";

const debug = createDebugger("connect:api:pg:listen");

let client: Promise<Client> | undefined;

/**
 * Lazily initialize a client dedicated to listening for notifications from our
 * Postgres database. If we don’t already have a client then this method will
 * connect one.
 *
 * IMPORTANT: This client is not directly accessible outside of this module!
 * If you‘d like a Postgres client of your own use `PGClient`.
 */
function connectClient(): Promise<Client> {
  if (client !== undefined) return client;
  client = actuallyConnectClient();

  return client;
}

/**
 * Initializes a new database client every single time the function is called.
 * Use `connectClient` to reuse the same client multiple times.
 */
async function actuallyConnectClient(): Promise<Client> {
  // Initialize the client...
  debug("Connecting notification listener client");
  const client = new Client(PGClient.getConnectionConfig());
  await client.connect();

  // Have our client listen for notifications. If we get a notification then
  // call the appropriate listeners for that channel.
  client.on("notification", notification => {
    if (!notification.channel.startsWith("connect.")) return;
    const channelName = notification.channel.slice(8);

    debug(`Received notification from "${channelName}"`);

    const channelListeners = listeners.get(channelName);
    if (channelListeners === undefined) return;
    if (channelListeners.size === 0) return;

    // Parse the notification payload! We assume it is in the correct format
    // since we control the database.
    const payload = JSON.parse(notification.payload!);

    channelListeners.forEach(async listener => {
      try {
        // Call the listener with our payload! It is not safe to assume that
        // the listener will never throw. So we need to have some form of
        // asynchronous error handling at the ready.
        await listener(payload);
      } catch (error) {
        // TODO: Better error handling. At least record that an error happened
        // in our monitoring software.
        logError(error);
      }
    });
  });

  return client;
}

// In a testing environment, disconnect the listening Postgres client after
// all tests have completed.
if (TEST) {
  afterAll(async () => {
    if (client !== undefined) {
      debug("Disconnecting notification listener client");
      const oldClient = client;
      client = undefined;
      await oldClient.then(client => client.end());
    }
  });
}

type MaybePromise<T> = T | Promise<T>;

/**
 * Notification listeners keyed by the channel they listen to.
 */
const listeners = new Map<string, Set<(payload: any) => MaybePromise<void>>>();

export const PGListen = {
  /**
   * Listen to all notifications on the given channel.
   *
   * If the listener throws an error we have a basic handler to at least report
   * the error.
   */
  async listen<Payload extends JSONValue>(
    channel: PGListenChannel<Payload>,
    listener: (payload: Payload) => MaybePromise<void>,
  ): Promise<() => Promise<void>> {
    // Connect our client that we use for listening to events...
    const client = await connectClient();

    // Get all the listeners for this channel. If there are no listeners for
    // this channel then we need to create a new set.
    let _channelListeners = listeners.get(channel.name);
    if (_channelListeners === undefined) {
      _channelListeners = new Set();
      listeners.set(channel.name, _channelListeners);
    }

    // Hack so that TypeScript remembers that we never set this variable back
    // to undefined.
    const channelListeners = _channelListeners;

    // If this is the first listener we are adding to the set of channel
    // listeners then we’ll need to actually listen to the channel in our
    // database using our dedicated listener client.
    //
    // We run this first so that if it fails we don’t get into a bad state.
    if (channelListeners.size === 0) {
      debug(`Listening to channel "${channel.name}"`);
      await client.query(
        sql.compile(sql`LISTEN ${sql.identifier(`connect.${channel.name}`)}`),
      );
    }

    // Add our listener!
    channelListeners.add(listener);

    return async () => {
      // Delete our listener!
      channelListeners.delete(listener);

      // If we have no more listeners then we don’t need to listen to this
      // channel in the database anymore.
      if (channelListeners.size === 0) {
        debug(`Unlistening to channel "${channel.name}"`);
        await client.query(
          sql.compile(
            sql`UNLISTEN ${sql.identifier(`connect.${channel.name}`)}`,
          ),
        );
      }
    };
  },

  /**
   * Send a notification on the provided channel with some context.
   *
   * This function should be easy to refactor if we ever want to change our
   * realtime backend to something other than Postgres.
   *
   * Note that this command [does not execute `NOTIFY` in a transaction][1]! If
   * `NOTIFY` is executed in a transaction, Postgres will wait for the
   * transaction to successfully commit before sending the notification. This is
   * consistent behavior with using some third-party service for realtime
   * notifications. Just remember that if your transaction aborts the
   * notification will still be sent.
   *
   * [1]: https://www.postgresql.org/docs/current/sql-notify.html
   */
  async notify<Payload extends JSONValue>(
    channel: PGListenChannel<Payload>,
    payload?: Payload,
  ): Promise<void> {
    // Connect our client that we use for sending notifications events...
    const client = await connectClient();

    debug(`Sending notification to channel "${channel.name}"`);

    // Send the notification outside of any transaction.
    const channelQuery = sql.literal(`connect.${channel.name}`);
    if (payload === undefined) {
      await client.query(sql.compile(sql`SELECT pg_notify(${channelQuery})`));
    } else {
      await client.query(
        sql.compile(
          sql`SELECT pg_notify(${channelQuery}, ${channel.serialize(payload)})`,
        ),
      );
    }
  },
};

/**
 * A Postgres channel that we can use for distributing realtime events.
 */
export type PGListenChannel<Payload extends JSONValue> = {
  /** The name of our channel. */
  readonly name: string;

  /**
   * Serializes a payload for our channel into a string.
   */
  serialize(payload: Payload): string;

  /**
   * Deserializes a serialized payload for our channel. Throws if the string is
   * in an incorrect format.
   *
   * NOTE: Since we completely control the database, we assume that string
   * payload is always in the correct format. We don’t validate string payloads
   * since they are trusted.
   */
  deserialize(string: string): Payload;
};

export const PGListenChannel = {
  /**
   * Creates a new, typed, channel that we can use for distributing
   * realtime events.
   */
  create<Payload extends JSONValue>(name: string): PGListenChannel<Payload> {
    return {
      name,
      serialize: JSON.stringify,
      deserialize: JSON.parse,
    };
  },
};
