/**
 * A unique type which is used as an identifier for accounts.
 */
export type AccountID = number & {readonly type: typeof AccountID};
declare const AccountID: unique symbol;

/**
 * The public profile of an account. Does not contain private information like
 * email address and password.
 */
export type AccountProfile = {
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
};
