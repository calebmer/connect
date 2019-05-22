import {APIError, APIErrorCode} from "@connect/api-client";
import {
  ClientBase,
  ConnectionConfig,
  Pool,
  QueryResult,
  types as pgTypes,
} from "pg";
import {SQLQuery, sql} from "./SQL";
import {TEST} from "../RunConfig";
import createDebugger from "debug";
import {logError} from "../logError";
import parseDate from "postgres-date";

const debug = createDebugger("connect:api:pg");

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

let poolID = 1;

// Whenever the pool newly connects a client this event is called and we can run
// some setup commands.
pool.on("connect", client => {
  // Mark the client with an ID which we will use in debugging.
  (client as any).poolID = poolID++;

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
export class PGClient {
  /**
   * Gets the Postgres connection configuration for the `pg` module.
   */
  public static getConnectionConfig(): ConnectionConfig {
    return getConnectionConfig();
  }

  /**
   * Executes an action with a Postgres client from our connection pool. Once
   * the action finishes we release the client back to our pool. Always executes
   * the action in a transaction. If the action throws then we rollback
   * the transaction.
   */
  public static async with<T>(
    action: (client: PGClient) => Promise<T>,
  ): Promise<T> {
    const client = await pool.connect();
    try {
      // Begin an explicit transaction.
      await client.query("BEGIN");

      // Execute our action. Make sure to invalidate the client after we
      // are done!
      const customClient = new PGClient(client);
      const result = await action(customClient);
      customClient.client = undefined;

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
  }

  /**
   * Run a single query without creating a transaction.
   *
   * - We require a `SQLQuery` object to prevent SQL injection attacks entirely.
   * - We log the provided query for debugging without parameters.
   * - We convert some database error codes into API error codes.
   */
  public static query(query: SQLQuery): Promise<QueryResult> {
    if (TEST) {
      // In a testing environment use `PGClient.with` which will rollback the
      // transaction after the query finishes.
      return PGClient.with(client => client.query(query));
    } else {
      const queryConfig = sql.compile(query);
      debug(typeof queryConfig === "string" ? queryConfig : queryConfig.text);

      return pool.query(queryConfig).catch(handlePGError);
    }
  }

  private constructor(
    /**
     * The Postgres client we use to execute queries in a transaction. Once the
     * transaction has finished we set this field to `undefined` so that our
     * users can’t execute another query against the client!
     */
    private client: ClientBase | undefined,
  ) {}

  /**
   * Executes a SQL query in our transaction. We use a custom `query()` function
   * so that we may do a couple of things.
   *
   * - We require a `SQLQuery` object to prevent SQL injection attacks entirely.
   * - We log the provided query for debugging without parameters.
   * - We convert some database error codes into API error codes.
   * - We prevent querying after the client has been released back to the pool.
   */
  public query(query: SQLQuery): Promise<QueryResult> {
    if (this.client === undefined) {
      throw new Error("Cannot use the context after it has been invalidated.");
    }

    const queryConfig = sql.compile(query);

    // If we have enabled query debugging then log our query along with the ID
    // of the pool the query is associated with. Useful for debugging queries
    // running concurrently.
    if (debug.enabled) {
      const poolID = (this.client as any).poolID;
      const queryText =
        typeof queryConfig === "string" ? queryConfig : queryConfig.text;
      debug((poolID != null ? `[${poolID}] ` : "") + queryText);
    }

    return this.client.query(queryConfig).catch(handlePGError);
  }
}

/**
 * Handles an error thrown by Postgres. Depending on the error code, we will
 * convert some common Postgres errors into API errors.
 */
function handlePGError(error: unknown): never {
  if (!(error instanceof Error)) {
    throw error;
  }

  // https://www.postgresql.org/docs/current/errcodes-appendix.html
  switch ((error as any).code) {
    // unique_violation
    case "23505":
      throw new APIError(APIErrorCode.ALREADY_EXISTS);

    // insufficient_privilege
    case "42501":
      throw new APIError(APIErrorCode.UNAUTHORIZED);

    default:
      throw error;
  }
}
