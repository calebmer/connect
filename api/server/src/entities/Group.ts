import {
  AccountID,
  DateTime,
  Group,
  GroupID,
  GroupMembership,
  Post,
} from "@connect/api-client";

/**
 * Manage a collection of groups.
 *
 * **IMPORTANT:** All of these methods are carefully designed to force the
 * caller to prove that they have a membership in the group before they can get
 * the data in the group. Don’t add a method to fetch a group directly by it’s
 * group ID or slug without prefixing that method `unsafe_` or something since
 * it would violate our privacy policy.
 */
export interface GroupCollection {
  /**
   * Gets the membership for an account in a group. We can use this as
   * authorization to confirm that an account can see the content in a group.
   */
  getMembership(
    accountID: AccountID,
    groupID: GroupID,
  ): Promise<GroupMembership | undefined>;

  /**
   * Gets the membership for an account in a group with the provided slug. We
   * can use this as authorization to confirm that an account can see the
   * content in a group.
   */
  getMembershipWithSlug(
    accountID: AccountID,
    groupSlug: string,
  ): Promise<GroupMembership | undefined>;

  /**
   * Gets the data for a group using a group membership. Since we have a group
   * membership we expect the group to exist. If it doesn’t, that’s an
   * internal error.
   *
   * **IMPORTANT:** We require a group membership to enforce our privacy policy.
   * If an account is not a member of a group then they cannot see it!
   */
  get(membership: GroupMembership): Promise<Group>;

  /**
   * Gets all the posts in a group with some pagination range to make sure we
   * don’t accidentally fetch _everything_.
   *
   * **IMPORTANT:** We require a group membership to enforce our privacy policy.
   * If an account is not a member of a group then they cannot see the posts
   * in that group!
   */
  getPosts(
    membership: GroupMembership,
    range: {after: DateTime | null; first: number},
  ): Promise<ReadonlyArray<Post>>;
}

type MockGroupData = {
  readonly group: Group;
  readonly memberships: Array<GroupMembership>;
  /** Posts are sorted so that the latest posts are last. */
  readonly posts: Array<Post>;
};

export class MockGroupCollection implements GroupCollection {
  private readonly groups: Array<MockGroupData> = [];
  private readonly groupBySlug = new Map<string, MockGroupData>();

  constructor(initialGroups: Array<MockGroupData>) {
    this.groups = initialGroups.map(({group, memberships, posts}) => ({
      group,
      memberships,
      // Make sure that the posts are sorted so that the last post to be
      // published comes last in the array.
      posts: posts.sort(),
    }));
    for (const data of this.groups) {
      this.groupBySlug.set(data.group.slug, data);
    }
  }

  async getMembership(
    accountID: AccountID,
    groupID: GroupID,
  ): Promise<GroupMembership | undefined> {
    const data = this.groups[groupID];
    if (!data) return undefined;
    return data.memberships.find(
      membership => membership.accountID === accountID,
    );
  }

  async getMembershipWithSlug(
    accountID: AccountID,
    groupSlug: string,
  ): Promise<GroupMembership | undefined> {
    const data = this.groupBySlug.get(groupSlug);
    if (!data) return undefined;
    return data.memberships.find(
      membership => membership.accountID === accountID,
    );
  }

  async get(membership: GroupMembership): Promise<Group> {
    return this.groups[membership.groupID].group;
  }

  async getPosts(
    membership: GroupMembership,
    range: {after: DateTime | null; first: number},
  ): Promise<ReadonlyArray<Post>> {
    const allPosts = this.groups[membership.groupID].posts;
    const posts: Array<Post> = [];

    let startIndex = allPosts.length - 1;
    if (range.after != null) {
      for (; startIndex >= 0; startIndex--) {
        if (allPosts[startIndex].publishedAt < range.after) {
          break;
        }
      }
    }

    for (let n = 0; n < range.first; n++) {
      const i = startIndex - n;
      if (i < 0) break;
      posts.push(allPosts[i]);
    }

    return posts;
  }
}
