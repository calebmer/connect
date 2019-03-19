import {PGAccountCollection} from "./entities/pg/PGAccount";
import {PGClient} from "./PGClient";
import {PGGroupCollection} from "./entities/pg/PGGroup";
import {PGPostCollection} from "./entities/pg/PGPost";
import {PGRefreshTokenCollection} from "./entities/pg/PGRefreshToken";

/**
 * The context of an API method using entity collection implementations
 * specialized for Postgres.
 */
export interface PGContext {
  readonly accounts: PGAccountCollection;
  readonly groups: PGGroupCollection;
  readonly posts: PGPostCollection;
  readonly refreshTokens: PGRefreshTokenCollection;
}

/**
 * A cache of Postgres contexts for their corresponding Postgres client. This is
 * useful when using a Postgres connection pool since we don’t need to
 * initialize a new context on every request.
 */
const contextCache = new WeakMap<PGClient, PGContext>();

export const PGContext = {
  /**
   * Get a Postgres context. Will reuse a previously cached context
   * if available.
   */
  get(client: PGClient): PGContext {
    let context = contextCache.get(client);
    if (context === undefined) {
      context = {
        accounts: new PGAccountCollection(client),
        groups: new PGGroupCollection(client),
        posts: new PGPostCollection(client),
        refreshTokens: new PGRefreshTokenCollection(client),
      };
      contextCache.set(client, context);
    }
    return context;
  },
};
