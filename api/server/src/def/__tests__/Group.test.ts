import {createAccount, createGroup, createGroupMember} from "../../TestFactory";
import {ContextTest} from "../../ContextTest";
import {getGroupBySlug} from "../Group";

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
