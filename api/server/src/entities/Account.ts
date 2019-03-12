/**
 * A unique type which is used as an identifier for accounts.
 */
export type AccountID = number & {readonly type: typeof AccountID};
declare const AccountID: unique symbol;

/**
 * Provides an interface to manage a collection of accounts.
 */
export interface AccountCollection {
  /**
   * Registers a new account with the provided data. If there is already an
   * account with this email address then the function will return undefined.
   *
   * Returns the ID of the new account.
   */
  register(data: {
    readonly name: string;
    readonly email: string;
    readonly passwordHash: string;
  }): Promise<AccountID | undefined>;

  /**
   * Gets the authentication information for an account using the account’s
   * email address. Returns undefined if no account for this email exists.
   */
  getAuth(email: string): Promise<AccountAuth | undefined>;

  /**
   * Gets the profile associated with the provided account ID. Returns undefined
   * if no account for this ID exists.
   */
  getProfile(id: AccountID): Promise<AccountProfile | undefined>;
}

/**
 * The authentication information for an account.
 */
export interface AccountAuth {
  readonly id: AccountID;
  readonly email: string;
  readonly passwordHash: string;
}

/**
 * The public profile of an account. Does not contain private information like
 * email address and password.
 */
export interface AccountProfile {
  readonly id: AccountID;

  /**
   * The name of the person they provided at registration for display.
   *
   * We recommend that people use their first name. This balances anonymity with
   * real, authentic, names.
   */
  readonly name: string;

  /**
   * An image URL for this account’s avatar.
   */
  readonly avatarURL: string | null;
}

interface MockAccountData extends AccountAuth, AccountProfile {}

export class MockAccountCollection implements AccountCollection {
  private readonly accounts: Array<MockAccountData> = [];
  private readonly accountByEmail = new Map<string, MockAccountData>();

  constructor() {
    if (process.env.NODE_ENV !== "test") {
      throw new Error("Cannot use mocks outside of a test environment.");
    }
  }

  async register({
    name,
    email,
    passwordHash,
  }: {
    readonly name: string;
    readonly email: string;
    readonly passwordHash: string;
  }): Promise<AccountID | undefined> {
    if (this.accountByEmail.has(email)) {
      return undefined;
    }
    const id = this.accounts.length as AccountID;
    const account: MockAccountData = {
      id,
      name,
      avatarURL: null,
      email,
      passwordHash,
    };
    this.accounts.push(account);
    this.accountByEmail.set(email, account);
    return id;
  }

  async getAuth(email: string): Promise<AccountAuth | undefined> {
    return this.accountByEmail.get(email);
  }

  async getProfile(id: AccountID): Promise<AccountProfile | undefined> {
    return this.accounts[id];
  }
}
