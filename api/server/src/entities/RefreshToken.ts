import {AccountID, RefreshToken} from "@connect/api-client";
import uuidV4 from "uuid/v4";

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

  /**
   * Destroys a refresh token so that it may never be used to generate a new
   * access token again!
   */
  destroy(token: RefreshToken): Promise<void>;
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

  async destroy(token: RefreshToken): Promise<void> {
    this.refreshTokens.delete(token);
  }
}
