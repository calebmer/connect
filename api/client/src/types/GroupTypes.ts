/** A unique type which is used as an identifier for groups. */
export type GroupID = string & {readonly _type: typeof GroupID};
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
  readonly slug: string | null;

  /**
   * The human readable name of a group. This name will be displayed on the main
   * group banner which serves to white label the group.
   */
  readonly name: string;
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
export type DateTime = string & {readonly _type: typeof DateTimeType};
declare const DateTimeType: unique symbol;

export const DateTime = {
  /**
   * Get the current `DateTime` value.
   */
  now(): DateTime {
    return new Date().toISOString() as DateTime;
  },
};
