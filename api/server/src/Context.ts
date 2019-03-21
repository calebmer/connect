import {SQLQuery, sql} from "./PGSQL";
import {AccountID} from "@connect/api-client";
import {PGClient} from "./PGClient";
import {QueryResult} from "pg";
import createDebugger from "debug";

const debugSQL = createDebugger("connect:api:pg");

/**
 * Context for an unauthorized API request.
 */
export class ContextUnauthorized {
  /**
   * Run an asynchronous action in an unauthorized context.
   */
  static withUnauthorized<T>(
    action: (client: ContextUnauthorized) => Promise<T>,
  ): Promise<T> {
    return PGClient.with(client => action(new ContextUnauthorized(client)));
  }

  /**
   * The Postgres client our context uses to execute database queries. The
   * client is private. It may not be accessed by the outside world. Instead
   * if you have a `Context` object you should call the `query()` method which
   * requires a `SQLQuery` and performs debug logging.
   */
  private readonly client: PGClient;

  protected constructor(client: PGClient) {
    this.client = client;
  }

  /**
   * Executes a SQL query. We require a `SQLQuery` object to prevent SQL
   * injection attacks entirely. We will also log the provided query
   * for debugging.
   */
  query(query: SQLQuery): Promise<QueryResult> {
    const queryConfig = sql.compile(query);
    debugSQL(typeof queryConfig === "string" ? queryConfig : queryConfig.text);
    return this.client.query(queryConfig);
  }
}

/**
 * Context for an authorized API request.
 */
export class Context extends ContextUnauthorized {
  /**
   * Run an asynchronous action in an authorized context.
   */
  static with<T>(
    accountID: AccountID,
    action: (client: Context) => Promise<T>,
  ): Promise<T> {
    return PGClient.with(async client => {
      // Set the account ID database parameter in our authenticated context
      // before running the action. We first verify that `accountID` is, indeed,
      // a number to avoid SQL injection attacks. Then we insert it directly
      // into the query.
      //
      // We use the underlying client from the `pg` module to avoid logging this
      // query which runs on every authorized API request.
      if (typeof accountID !== "number") {
        throw new Error("Expected accountID to be a number.");
      }
      await client.query(`SET LOCAL connect.account_id = ${accountID}`);

      // Run our action!
      return action(new Context(client, accountID));
    });
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
