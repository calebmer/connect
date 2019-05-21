import {SQLQuery, sql} from "./pg/SQL";
import {AccountID} from "@connect/api-client";
import {PGClient} from "./pg/PGClient";
import {QueryResult} from "pg";

/**
 * A context that can be queried.
 */
export interface ContextQueryable {
  /**
   * Executes a SQL query. We require a `SQLQuery` object to prevent SQL
   * injection attacks entirely.
   */
  query(query: SQLQuery): Promise<QueryResult>;
}

/**
 * Context for an unauthorized API request.
 */
export class ContextUnauthorized implements ContextQueryable {
  /**
   * Run an asynchronous action in an unauthorized context.
   */
  static async withUnauthorized<T>(
    action: (ctx: ContextUnauthorized) => Promise<T>,
  ): Promise<T> {
    let ctx: ContextUnauthorized | undefined;
    try {
      // Connect a Postgres client. This will execute the action in
      // a transaction.
      const result = await PGClient.with(client => {
        ctx = new ContextUnauthorized(client);
        return action(ctx);
      });

      // Commit the context! This will invalidate the context so it can’t be
      // queried again and will run any after-commit callbacks.
      await ctx!.handleCommit();

      return result;
    } catch (error) {
      // If there was an error we still need to invalidate our context...
      if (ctx !== undefined) {
        await ctx.handleRollback();
      }
      throw error;
    }
  }

  /**
   * The Postgres client our context uses to execute database queries. The
   * client is private. It may not be accessed by the outside world. Instead
   * if you have a `Context` object you should call the `query()` method which
   * requires a `SQLQuery` and performs debug logging.
   *
   * When the context is done being used we set the client to `undefined` which
   * stops the programmer from making any more queries with this context. This
   * prevents accidental leaks where the context is returned in some way by the
   * transaction it was scoped to.
   */
  private readonly client: PGClient;

  /**
   * Callbacks which are scheduled to run after our context’s transaction has
   * been commit.
   *
   * The commit callback may not use the context! The context will be
   * invalidated before the callbacks are executed.
   */
  private readonly afterCommitCallbacks: Array<() => Promise<void>> = [];

  protected constructor(client: PGClient) {
    this.client = client;
  }

  /**
   * Executes a SQL query. We use a custom `query()` function so that we may do
   * a couple of things.
   *
   * - We require a `SQLQuery` object to prevent SQL injection attacks entirely.
   * - We log the provided query for debugging without parameters.
   * - We convert some database error codes into API error codes.
   * - We prevent querying after the client has been released back to the pool.
   */
  public query(query: SQLQuery): Promise<QueryResult> {
    return this.client.query(query);
  }

  /**
   * Schedules a callback to run after the context successfully commits. This
   * callback will not run if the action owning the transaction throws!
   *
   * The context will be invalidated before running the callback so you won’t
   * be able to use any context methods like `Context.query`.
   */
  public afterCommit(callback: () => Promise<void>) {
    this.afterCommitCallbacks.push(callback);
  }

  /**
   * Invalidates a context after the transaction has committed. Also runs all
   * the callbacks scheduled to run after we commit. Awaits all those callbacks
   * to complete.
   *
   * Invaliding the context is useful for stopping leaks where the programmer
   * accidentally returns the context from their transaction.
   */
  protected async handleCommit(): Promise<void> {
    await Promise.all(this.afterCommitCallbacks.map(callback => callback()));
  }

  /**
   * Invalidates a context after the transaction has been rolled back. This is
   * useful for stopping leaks where the programmer accidentally returns the
   * context from their transaction.
   */
  protected async handleRollback(): Promise<void> {}
}

/**
 * Context for an authorized API request.
 */
export class Context extends ContextUnauthorized {
  /**
   * Run an asynchronous action in an authorized context.
   */
  static async withAuthorized<T>(
    accountID: AccountID,
    action: (ctx: Context) => Promise<T>,
  ): Promise<T> {
    let ctx: Context | undefined;
    try {
      const result = await PGClient.with(async client => {
        // Set the account ID database parameter in our authenticated context
        // before running the action. We first verify that `accountID` is, indeed,
        // a number to avoid SQL injection attacks. Then we insert it directly
        // into the query.
        //
        // We use the underlying client from the `pg` module to avoid logging this
        // query which runs on every authorized API request.
        if (typeof accountID === "number") {
          await client.query(
            sql`SET LOCAL connect.account_id = ${sql.dangerouslyInjectRawString(
              String(accountID),
            )}`,
          );
        } else {
          throw new Error("Expected accountID to be a number.");
        }

        // Create our context. We will invalidate it after the action completes.
        ctx = new Context(client, accountID);
        return action(ctx);
      });

      // Commit the context! This will invalidate the context so it can’t be
      // queried again and will run any after-commit callbacks.
      await ctx!.handleCommit();

      return result;
    } catch (error) {
      // If there was an error we still need to invalidate our context...
      if (ctx !== undefined) {
        await ctx.handleRollback();
      }
      throw error;
    }
  }

  /**
   * The ID of the authenticated account.
   */
  public readonly accountID: AccountID;

  protected constructor(client: PGClient, accountID: AccountID) {
    super(client);
    this.accountID = accountID;
  }
}

/**
 * The context for a subscription. A subscription context does not carry around
 * a Postgres client unlike `Context` but it allows us to temporarily upgrade
 * to a `Context`. For this reason, a subscription context can live as long as
 * we’d like and isn’t scoped to a particular function call.
 */
export class ContextSubscription<Message> {
  /**
   * The ID of the authenticated account.
   */
  public readonly accountID: AccountID;

  /**
   * Publishes a message to this subscription.
   */
  public readonly publish: (message: Message) => void;

  constructor(accountID: AccountID, publish: (message: Message) => void) {
    this.accountID = accountID;
    this.publish = publish;
  }

  /**
   * Upgrades our subscription context to an authorized `Context` that we can
   * run database queries against.
   */
  withAuthorized<T>(action: (ctx: Context) => Promise<T>): Promise<T> {
    return Context.withAuthorized(this.accountID, action);
  }
}
