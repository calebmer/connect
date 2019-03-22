import {Context, ContextQueryable, ContextUnauthorized} from "./Context";
import {Pool, PoolClient, QueryResult} from "pg";
import {SQLQuery, sql} from "./PGSQL";
import {AccountID} from "@connect/api-client";
import {TEST} from "./RunConfig";

// Don’t allow this module to be used outside of a testing environment.
if (!TEST) {
  throw new Error("Can only use a test context in a test environment.");
}

// Our pool for test contexts will always use the role `connect_api_test` which
// is a superuser with complete access to the database. It also only exists in
// test environments.
const pool = new Pool({
  user: "connect_api_test",
});

pool.on("connect", client => {
  client.query("SET search_path = connect");
});

/**
 * Context for running a test. We run our tests with a superuser role. That
 * allows the test to inspect anything in the database it wants. We can also
 * “fork” our context into an authorized and unauthorized context.
 */
export class ContextTest implements ContextQueryable {
  /**
   * Executes an asynchronous action with a test context. Wraps the execution in
   * a transaction and _always_ rolls back the transaction once it has finished.
   */
  static async with<T>(action: (ctx: ContextTest) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    const ctx = new ContextTest(client);
    try {
      await client.query("BEGIN");
      const result = await action(ctx);
      await client.query("ROLLBACK");
      return result;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      ctx.invalidate();
      client.release();
    }
  }

  /**
   * The client we use for executing queries against our database.
   */
  private client: PoolClient | undefined;

  private constructor(client: PoolClient) {
    this.client = client;
  }

  /**
   * Forks this test context into an unauthorized context. We downgrade the role
   * from a superuser to our normal API role.
   *
   * NOTE: Unlike `Context.withUnauthorized()` this does not run the action in
   * a new transaction. It runs the action inside of our test context
   * transaction. Cannot call this function in parallel with other `ContextTest`
   * methods or the transaction will get messed up!
   */
  async withUnauthorized<T>(
    action: (ctx: ContextUnauthorized) => Promise<T>,
  ): Promise<T> {
    if (this.client === undefined) {
      throw new Error("Cannot query a context after it has been invalidated.");
    }
    await this.client.query("SET LOCAL ROLE connect_api");
    const ctx = new (ContextUnauthorized as any)(this.client);
    try {
      return await action(ctx);
    } finally {
      ctx.invalidate();
      try {
        await this.client.query("RESET ROLE");
      } catch (error) {
        // Ignore errors here...
      }
    }
  }

  /**
   * Forks this test context into an authorized context. We downgrade the role
   * from a superuser to our normal API role.
   *
   * NOTE: Unlike `Context.withAuthorized()` this does not run the action in
   * a new transaction. It runs the action inside of our test context
   * transaction. Cannot call this function in parallel with other `ContextTest`
   * methods or the transaction will get messed up!
   */
  async withAuthorized<T>(
    accountID: AccountID,
    action: (ctx: Context) => Promise<T>,
  ): Promise<T> {
    if (this.client === undefined) {
      throw new Error("Cannot query a context after it has been invalidated.");
    }
    if (typeof accountID !== "number") {
      throw new Error("Expected accountID to be a number.");
    }
    await this.client.query("SET LOCAL ROLE connect_api");
    await this.client.query(`SET LOCAL connect.account_id = ${accountID}`);
    const ctx = new (Context as any)(this.client, accountID);
    try {
      return await action(ctx);
    } finally {
      ctx.invalidate();
      try {
        await this.client.query("RESET ROLE");
        await this.client.query("RESET connect.account_id");
      } catch (error) {
        // Ignore errors here...
      }
    }
  }

  /**
   * Executes a SQL query. We require a `SQLQuery` object to prevent SQL
   * injection attacks entirely.
   *
   * NOTE: Cannot call this function in parallel with other `ContextTest`
   * methods or the transaction state will get messed up!
   */
  query(query: SQLQuery): Promise<QueryResult> {
    if (this.client === undefined) {
      throw new Error("Cannot query a context after it has been invalidated.");
    }
    const queryConfig = sql.compile(query);
    return this.client.query(queryConfig);
  }

  /**
   * Invalidates our test context. Useful for preventing contexts from leaking
   * out of their transaction.
   */
  private invalidate() {
    this.client = undefined;
  }
}
