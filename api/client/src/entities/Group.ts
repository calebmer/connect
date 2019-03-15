import {AccountID} from "./Account";

/** A unique type which is used as an identifier for groups. */
export type GroupID = number & {readonly type: typeof GroupID};
declare const GroupID: unique symbol;

/**
 * A group is a collection of people who come together to discuss some common
 * interest. This type holds information about a group that will be useful in
 * our UI.
 */
export type Group = {
  readonly id: GroupID;

  /**
   * The group’s slug is for uniquely identifying a group in a URL. Slugs may
   * only be made up of URL safe characters.
   *
   * The term [slug][1] is used to describe this concept in many other web
   * publishing systems.
   *
   * [1]: https://en.wikipedia.org/wiki/Clean_URL#Slug
   */
  readonly slug: string;

  /**
   * The human readable name of a group. This name will be displayed on the main
   * group banner which serves to white label the group.
   */
  readonly name: string;
};

/**
 * Represents an account‘s membership in a group.
 *
 * NOTE: We use this type in our backend as a kind of “authorization” token. You
 * can’t see the contents of a group if you are not a member of that group!
 */
export type GroupMembership = {
  /** The account whose membership this is. */
  readonly accountID: AccountID;
  /** The group the account is a member of. */
  readonly groupID: GroupID;
  /** The time at which the account became a member of the group. */
  readonly joinedAt: DateTime;
};

/**
 * Some point in time encoded as [ISO 8601][1]. The name comes from the fact
 * that this type includes both a date and a time.
 *
 * Relevant [xkcd][2] reference.
 *
 * [1]: https://en.wikipedia.org/wiki/ISO_8601
 * [2]: https://xkcd.com/1179
 */
export type DateTime = string & {readonly type: typeof DateTime};
declare const DateTime: unique symbol;
