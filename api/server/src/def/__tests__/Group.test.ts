import {createAccount, createGroup, createGroupMember} from "../../TestFactory";
import {getAllGroupMemberships, getGroupBySlug} from "../Group";
import {ContextTest} from "../../ContextTest";

describe("getGroupBySlug", () => {
  test("does not return a group that does not exist", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getGroupBySlug(ctx, {slug: "nope"})).toEqual({
          group: null,
        });
      });
    });
  });

  test("does return a group the account is a member of", () => {
    return ContextTest.with(async ctx => {
      const group = await createGroup(ctx);
      const groupMember = await createGroupMember(ctx, {groupID: group.id});

      await ctx.withAuthorized(groupMember.accountID, async ctx => {
        expect(await getGroupBySlug(ctx, {slug: group.slug!})).toEqual({group});
      });
    });
  });

  test("does not return a group if the account is not a member", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getGroupBySlug(ctx, {slug: group.slug!})).toEqual({
          group: null,
        });
      });
    });
  });

  test("does not return a group if some other account is a member", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);
      await createGroupMember(ctx, {groupID: group.id});
      await createGroupMember(ctx, {groupID: group.id});

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getGroupBySlug(ctx, {slug: group.slug!})).toEqual({
          group: null,
        });
      });
    });
  });

  test("does not return a group if the account is a member of another group", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);
      await createGroupMember(ctx, {accountID: account.id});
      await createGroupMember(ctx, {accountID: account.id});

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getGroupBySlug(ctx, {slug: group.slug!})).toEqual({
          group: null,
        });
      });
    });
  });

  test("does not return a group if some other account is a member and if the account is a member of another group", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);
      await createGroupMember(ctx, {groupID: group.id});
      await createGroupMember(ctx, {groupID: group.id});
      await createGroupMember(ctx, {accountID: account.id});
      await createGroupMember(ctx, {accountID: account.id});

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getGroupBySlug(ctx, {slug: group.slug!})).toEqual({
          group: null,
        });
      });
    });
  });

  test("does return a group the account is not the only member of", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);
      await createGroupMember(ctx, {groupID: group.id});
      await createGroupMember(ctx, {groupID: group.id});
      await createGroupMember(ctx, {accountID: account.id});
      await createGroupMember(ctx, {accountID: account.id, groupID: group.id});

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getGroupBySlug(ctx, {slug: group.slug!})).toEqual({group});
      });
    });
  });

  test("will lookup a group by its ID as well as its slug", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);
      await createGroupMember(ctx, {accountID: account.id, groupID: group.id});

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getGroupBySlug(ctx, {slug: group.id})).toEqual({group});
        expect(await getGroupBySlug(ctx, {slug: group.slug!})).toEqual({group});
      });
    });
  });

  test("will lookup a group by its ID if it does not have a slug", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx, {slug: null});
      await createGroupMember(ctx, {accountID: account.id, groupID: group.id});
      expect(group.slug).toEqual(null);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getGroupBySlug(ctx, {slug: group.id})).toEqual({group});
      });
    });
  });
});

describe("getAllGroupMemberships", () => {
  test("will return no memberships if the group does not exist", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getAllGroupMemberships(ctx, {slug: "nope"})).toEqual({
          memberships: [],
          accounts: [],
        });
      });
    });
  });

  test("will return no memberships for a group we can’t see by ID", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);

      await createGroupMember(ctx, {groupID: group.id});
      await createGroupMember(ctx, {groupID: group.id});
      await createGroupMember(ctx, {groupID: group.id});

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getAllGroupMemberships(ctx, {slug: group.id})).toEqual({
          memberships: [],
          accounts: [],
        });
      });
    });
  });

  test("will return no memberships for a group we can’t see by slug", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);

      await createGroupMember(ctx, {groupID: group.id});
      await createGroupMember(ctx, {groupID: group.id});
      await createGroupMember(ctx, {groupID: group.id});

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getAllGroupMemberships(ctx, {slug: group.slug!})).toEqual({
          memberships: [],
          accounts: [],
        });
      });
    });
  });

  test("will return memberships for a group we can see by ID", () => {
    return ContextTest.with(async ctx => {
      const group = await createGroup(ctx);

      const account1 = await createAccount(ctx);
      const account2 = await createAccount(ctx);
      const account3 = await createAccount(ctx);
      const account4 = await createAccount(ctx);

      const member1 = await createGroupMember(ctx, {
        accountID: account1.id,
        groupID: group.id,
      });
      const member2 = await createGroupMember(ctx, {
        accountID: account2.id,
        groupID: group.id,
      });
      const member3 = await createGroupMember(ctx, {
        accountID: account3.id,
        groupID: group.id,
      });
      const member4 = await createGroupMember(ctx, {
        accountID: account4.id,
        groupID: group.id,
      });

      await ctx.withAuthorized(account1.id, async ctx => {
        expect(await getAllGroupMemberships(ctx, {slug: group.slug!})).toEqual({
          memberships: [member1, member2, member3, member4],
          accounts: [account1, account2, account3, account4],
        });
      });
    });
  });
});
