import {AccountID, AccountProfile} from "@connect/api-client";
import {API} from "../api/API";
import {Cache} from "./framework/Cache";
import {CacheSingleton} from "./framework/CacheSingleton";

/**
 * Caches accounts by their ID.
 */
export const AccountCache = new Cache<AccountID, AccountProfile>({
  async load(id) {
    const {account} = await API.account.getProfile({id});
    if (account == null) throw new Error("Account not found.");
    return account;
  },
});

/**
 * Cache that holds the identity of the current account. Also loads the current
 * account’s profile which we insert into `AccountCache`.
 */
export const CurrentAccountCache = new CacheSingleton<AccountID>(async () => {
  const {account} = await API.account.getCurrentProfile();
  AccountCache.insert(account.id, account);
  return account.id;
});
