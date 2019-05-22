import {AccountID, SubscriptionID, generateID} from "@connect/api-client";
import {
  Context,
  ContextQueryable,
  ContextSubscription,
  ContextUnauthorized,
} from "./Context";
import {Pool, PoolClient, QueryResult} from "pg";
import {SQLQuery, sql} from "./pg/SQL";
import {PGClient} from "./pg/PGClient";
import {TEST} from "./RunConfig";
import createDebugger from "debug";

// Don’t allow this module to be used outside of a testing environment.
if (!TEST) {
  throw new Error("Can only use a test context in a test environment.");
}

const debug = createDebugger("connect:api:pg");

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

  /**
   * Normally `Context.withAuthorization` will create a new isolated
   * transaction with `BEGIN` and `COMMIT`. However, in testing we want to run
   * all our code in a single transaction since we `ROLLBACK` at the end so
   * any changes inside a transaction are not visible to the outside world. That
   * means we need to simulate transactions in the test context. We do this by
   * serializing all our transactions in a given test context.
   *
   * If this is set to a promise then that means a transaction is currently
   * running. We must wait for it to resolve before starting the
   * next transaction.
   */
  private transaction: Promise<void> | undefined = undefined;

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
    while (this.transaction !== undefined) {
      await this.transaction;
    }
    const promise = this._withUnauthorized(action);
    this.transaction = promise.then(
      () => (this.transaction = undefined),
      () => (this.transaction = undefined),
    );
    return promise;
  }

  /**
   * The internal implementation of `withUnauthorized` that doesn’t handle
   * locking a transaction.
   */
  async _withUnauthorized<T>(
    action: (ctx: ContextUnauthorized) => Promise<T>,
  ): Promise<T> {
    if (this.client === undefined) {
      throw new Error("Cannot query a context after it has been invalidated.");
    }
    await this.client.query("SET LOCAL ROLE connect_api");
    const ctx = new (ContextUnauthorized as any)(
      new (PGClient as any)(this.client),
    );
    try {
      const result = await action(ctx);
      await ctx.handleCommit();
      return result;
    } catch (error) {
      await ctx.handleRollback();
      throw error;
    } finally {
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
    while (this.transaction !== undefined) {
      await this.transaction;
    }
    const promise = this._withAuthorized(accountID, action);
    this.transaction = promise.then(
      () => (this.transaction = undefined),
      () => (this.transaction = undefined),
    );
    return promise;
  }

  /**
   * The internal implementation of `withAuthorized` that doesn’t handle
   * locking a transaction.
   */
  async _withAuthorized<T>(
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
    const ctx = new (Context as any)(
      new (PGClient as any)(this.client),
      accountID,
    );
    try {
      const result = await action(ctx);
      await ctx.handleCommit();
      return result;
    } catch (error) {
      await ctx.handleRollback();
      throw error;
    } finally {
      try {
        await this.client.query("RESET ROLE");
        await this.client.query("RESET connect.account_id");
      } catch (error) {
        // Ignore errors here...
      }
    }
  }

  /**
   * Creates a new context for a subscription. Unlike `withUnauthorized` and
   * `withAuthorized`, we don’t scope the context to an action since there’s
   * nothing we’d need to cleanup or invalidate at the end.
   */
  withSubscription<Message>(
    accountID: AccountID,
    publish: (message: Message) => void,
  ): ContextSubscription<Message> {
    return new ContextTestSubscription(this, generateID(), accountID, publish);
  }

  /**
   * Executes a SQL query. We require a `SQLQuery` object to prevent SQL
   * injection attacks entirely.
   *
   * NOTE: Cannot call this function in parallel with other `ContextTest`
   * methods or the transaction state will get messed up!
   */
  async query(query: SQLQuery): Promise<QueryResult> {
    while (this.transaction !== undefined) {
      await this.transaction;
    }
    const promise = this._query(query);
    this.transaction = promise.then(
      () => (this.transaction = undefined),
      () => (this.transaction = undefined),
    );
    return promise;
  }

  /**
   * The internal implementation of `query` that doesn’t handle
   * locking a transaction.
   */
  _query(query: SQLQuery): Promise<QueryResult> {
    if (this.client === undefined) {
      throw new Error("Cannot query a context after it has been invalidated.");
    }

    const queryConfig = sql.compile(query);
    debug(typeof queryConfig === "string" ? queryConfig : queryConfig.text);

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

/**
 * Private fork of `ContextSubscription` to modify the behavior to work well
 * in a test context. Usually, a `ContextSubscription` will not carry around a
 * client but we’ve given it support to upgrade to an authorized context. In
 * order to stay in the right transaction we need to upgrade to an authorized
 * context with `ContextTest`.
 */
class ContextTestSubscription<Message> extends ContextSubscription<Message> {
  private readonly ctx: ContextTest;

  constructor(
    ctx: ContextTest,
    subscriptionID: SubscriptionID,
    accountID: AccountID,
    publish: (message: Message) => void,
  ) {
    super(subscriptionID, accountID, publish);
    this.ctx = ctx;
  }

  withAuthorized<T>(action: (ctx: Context) => Promise<T>): Promise<T> {
    return this.ctx.withAuthorized(this.accountID, action);
  }
}
