import {AccountID} from "@connect/api-client";
import {PGClient} from "./pg/PGClient";

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
    return PGClient.with(client => action(new Context(client, accountID)));
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
