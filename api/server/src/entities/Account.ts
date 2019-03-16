import {AccountID, AccountProfile} from "@connect/api-client";
import {TEST} from "../RunConfig";

/**
 * Manage a collection of accounts.
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

interface MockAccountData extends AccountAuth, AccountProfile {}

export class MockAccountCollection implements AccountCollection {
  private readonly accounts: Array<MockAccountData> = [];
  private readonly accountByEmail = new Map<string, MockAccountData>();

  constructor() {
    if (!TEST) {
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
    const account = this.accountByEmail.get(email);
    if (account === undefined) {
      return undefined;
    } else {
      return {
        id: account.id,
        email: account.email,
        passwordHash: account.passwordHash,
      };
    }
  }

  async getProfile(id: AccountID): Promise<AccountProfile | undefined> {
    const account = this.accounts[id];
    if (account === undefined) {
      return undefined;
    } else {
      return {
        id: account.id,
        name: account.name,
        avatarURL: account.avatarURL,
      };
    }
  }
}
