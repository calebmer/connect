import {Pool, PoolClient} from "pg";

/**
 * A database connection pool. Connecting a new client on every request would be
 * to expensive, but only having one client for our entire server would mean all
 * requests need to be serialized. With a pool we can have a set of connections
 * to draw from whenever we need.
 *
 * Don’t use `pool` directly! Instead use the `withClient()` function which
 * automatically handles acquiring and releasing a client.
 */
const pool = new Pool();

// Whenever the pool newly connects a client this event is called and we can run
// some setup commands.
pool.on("connect", client => {
  client.query("SET search_path = connect");
});

// The pool with emit an error on behalf of any idle clients it contains if a
// backend error or network partition happens
pool.on("error", (error, _client) => {
  console.error("Unexpected error on idle client"); // eslint-disable-line no-console
  console.error(error); // eslint-disable-line no-console
  process.exit(1);
});

/**
 * A Postgres database client which we may directly execute SQL queries against.
 */
export interface DB extends PoolClient {}

/**
 * Executes an action with a database client from our connection pool. Once the
 * action finishes we release the client back to our pool.
 */
export async function withDatabase<T>(
  action: (db: DB) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let result: T;
  try {
    result = await action(client);
  } finally {
    client.release();
  }
  return result;
}
