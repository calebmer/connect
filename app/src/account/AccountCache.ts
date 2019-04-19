import {AccountID, AccountProfile} from "@connect/api-client";
import {Cache, useCacheData} from "../cache/Cache";
import {CacheSingleton, useCacheSingletonData} from "../cache/CacheSingleton";
import {API} from "../api/API";
import {Image} from "react-native";

/**
 * Caches accounts by their ID.
 */
export const AccountCache = new Cache<AccountID, AccountProfile>({
  async load(id) {
    const {account} = await API.account.getProfile({id});
    if (account == null) throw new Error("Account not found.");
    await preloadAccountAvatar(account);
    return account;
  },

  // Load many account profiles at the same time as a performance optimization
  // so we don’t need to make a bunch of asynchronous requests at once.
  async loadMany(ids) {
    // Fetch all our profiles...
    const {accounts} = await API.account.getManyProfiles({ids});

    // Setup a map where we can fetch an account profile by its ID.
    const accountByID = new Map<AccountID, AccountProfile>();
    for (let i = 0; i < accounts.length; i++) {
      const account = accounts[i];
      accountByID.set(account.id, account);
    }

    // Return the account associated with each ID. If a particular account was
    // not returned by our API then return an error for that position instead.
    return Promise.all(
      ids.map(async id => {
        const account = accountByID.get(id);
        if (account === undefined) {
          return new Error("Account not found.");
        } else {
          await preloadAccountAvatar(account);
          return account;
        }
      }),
    );
  },
});

/**
 * Cache that holds the identity of the current account. Also loads the current
 * account’s profile which we insert into `AccountCache`.
 */
export const CurrentAccountCache = new CacheSingleton<AccountID>(async () => {
  const {account} = await API.account.getCurrentProfile();
  AccountCache.insert(account.id, account);
  await preloadAccountAvatar(account);
  return account.id;
});

/**
 * Preloads the account’s avatar if one exists. Any errors while loading the
 * avatar are ignored.
 *
 * NOTE: We need to call this everywhere we receive an account from the API!
 *
 * TODO: Maybe we should add an `onInsert` hook to `AccountCache`? So this runs
 * on every insert. For example, I almost missed the account cache load in
 * `CurrentAccountCache`.
 */
async function preloadAccountAvatar(account: AccountProfile): Promise<void> {
  if (account.avatarURL != null) {
    try {
      await Image.prefetch(account.avatarURL);
    } catch (error) {
      // ignore error
    }
  }
}

/**
 * Utility hook to get the current account profile.
 */
export function useCurrentAccount(): AccountProfile {
  const id = useCacheSingletonData(CurrentAccountCache);
  return useCacheData(AccountCache, id);
}
