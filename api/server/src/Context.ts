import {Database} from "./Database";

/**
 * The API was accessed with an unauthorized context.
 */
export class ContextUnauthorized {
  /**
   * A database connection from our Postgres connection pool. The connection
   * will be released at the end of our request.
   */
  public readonly database: Database;

  constructor(database: Database) {
    this.database = database;
  }
}

/**
 * An account was successfully authorized when accessing the API.
 */
export class Context extends ContextUnauthorized {
  /**
   * The account authorized by our API. The account is not guaranteed to exist.
   */
  public readonly accountID: number;

  constructor({
    database,
    accountID,
  }: {
    readonly database: Database;
    readonly accountID: number;
  }) {
    super(database);
    this.accountID = accountID;
  }
}
