import {AccountID, AccountProfile} from "@connect/api-client";
import {API} from "../../api/API";
import {Cache} from "../Cache";

/**
 * Caches accounts by their ID.
 */
export const AccountCache = new Cache<AccountID, AccountProfile>(async id => {
  const {account} = await API.account.getProfile({id});
  if (account == null) throw new Error("Account not found.");
  return account;
});
