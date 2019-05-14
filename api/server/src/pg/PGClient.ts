import {ClientBase, ConnectionConfig, Pool, types as pgTypes} from "pg";
import {TEST} from "../RunConfig";
import {logError} from "../logError";
import parseDate from "postgres-date";

// We expect `jest-global-setup.js` to start a temporary test database we can
// connect to. We also expect that it exposes its Postgres configuration through
// environment variables.
if (TEST && !(process.env.PGHOST || "").includes("connect-test-postgres")) {
  throw new Error("Expected PGHOST to be a temporary test database.");
}

/**
 * Gets the Postgres connection configuration for the `pg` module.
 */
function getConnectionConfig(): ConnectionConfig {
  return {
    // Always connect to Postgres with the `connect_api` role! No matter what
    // configuration we are given.
    user: "connect_api",

    // If the port and database are available in environment variables then use
    // them. Otherwise use our default values.
    port: process.env.PGPORT ? parseInt(process.env.PGPORT, 10) : 5000,
    database: process.env.PGDATABASE || "connect",
  };
}

/**
 * A database connection pool. Connecting a new client on every request would be
 * to expensive, but only having one client for our entire server would mean all
 * requests need to be serialized. With a pool we can have a set of connections
 * to draw from whenever we need.
 *
 * Don’t use `pool` directly! Instead use the `PGClient.with()` function which
 * automatically handles acquiring and releasing a client.
 */
const pool = new Pool(getConnectionConfig());

// Whenever the pool newly connects a client this event is called and we can run
// some setup commands.
pool.on("connect", client => {
  // Set the search path to our project’s database schema.
  client.query("SET search_path = connect");
});

// The pool with emit an error on behalf of any idle clients it contains if a
// backend error or network partition happens
pool.on("error", (error, _client) => {
  logError(error);
});

// In a testing environment, disconnect all the clients in our Pool after
// all tests have completed.
if (TEST) {
  afterAll(async () => {
    await pool.end();
  });
}

// Parse timestamps as an ISO string instead of a JavaScript `Date` object.
const TIMESTAMPTZ_OID = 1184;
const TIMESTAMP_OID = 1114;
pgTypes.setTypeParser(TIMESTAMPTZ_OID, parseTimestamp);
pgTypes.setTypeParser(TIMESTAMP_OID, parseTimestamp);

function parseTimestamp(isoString: string | null): string | null {
  if (isoString === null) return null;
  const isoDate = parseDate(isoString);
  if (isoDate === null) return null;
  return isoDate.toISOString();
}

/**
 * A Postgres database client which we may directly execute SQL queries against.
 */
export interface PGClient extends ClientBase {}

export const PGClient = {
  getConnectionConfig,

  /**
   * Executes an action with a Postgres client from our connection pool. Once
   * the action finishes we release the client back to our pool.
   */
  async with<T>(action: (client: PGClient) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      // Begin an explicit transaction.
      await client.query("BEGIN");

      // Execute our action...
      const result = await action(client);

      // If the action was successful then commit our transaction!
      //
      // Unless we are in a test environment. If we are testing then always
      // rollback our transaction even if it succeeded.
      if (!TEST) {
        await client.query("COMMIT");
      } else {
        await client.query("ROLLBACK");
      }

      // Return the result.
      return result;
    } catch (error) {
      // If there was an error, rollback our transaction.
      await client.query("ROLLBACK");

      // Rethrow the error.
      throw error;
    } finally {
      // Always release our client back to the pool.
      client.release();
    }
  },
};
