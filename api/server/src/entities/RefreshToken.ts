import {AccountID} from "./Account";
import uuidV4 from "uuid/v4";

/**
 * The refresh token which an account may use to generate a new access token.
 */
export type RefreshToken = string & {readonly type: typeof RefreshToken};
declare const RefreshToken: unique symbol;

/**
 * Manages the creation and usage of refresh tokens.
 */
export interface RefreshTokenCollection {
  /**
   * Creates a new refresh token for the provided account.
   */
  generate(id: AccountID): Promise<RefreshToken>;

  /**
   * Mark a refresh token as used and return the account that the refresh token
   * is for. If no such refresh token exists then return undefined.
   */
  use(token: RefreshToken): Promise<AccountID | undefined>;
}

export class MockRefreshTokenCollection implements RefreshTokenCollection {
  private readonly refreshTokens = new Map<RefreshToken, AccountID>();

  constructor() {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("Cannot use mocks outside of a test environment.");
    }
  }

  async generate(id: AccountID): Promise<RefreshToken> {
    const refreshToken = uuidV4() as RefreshToken;
    this.refreshTokens.set(refreshToken, id);
    return refreshToken;
  }

  async use(token: RefreshToken): Promise<AccountID | undefined> {
    return this.refreshTokens.get(token);
  }
}
