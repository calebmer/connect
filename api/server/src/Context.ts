import {AccountID} from "@connect/api-client";
import {PGClient} from "./pg/PGClient";
import {PGAccountCollection} from "./entities/pg/PGAccount";
import {PGGroupCollection} from "./entities/pg/PGGroup";
import {PGRefreshTokenCollection} from "./entities/pg/PGRefreshToken";
import {PGPostCollection} from "./entities/pg/PGPost";

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
   * The Postgres client our context uses to execute database queries.
   */
  public readonly client: PGClient;

  protected constructor(client: PGClient) {
    this.client = client;

    this.accounts = new PGAccountCollection(client);
    this.groups = new PGGroupCollection(client);
    this.refreshTokens = new PGRefreshTokenCollection(client);
    this.posts = new PGPostCollection(client);
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
      await (client as any).client.query(
        `SET LOCAL connect.account_id = ${accountID}`,
      );

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
