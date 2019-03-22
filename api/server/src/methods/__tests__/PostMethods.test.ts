import {createAccount, createGroupMember, createPost} from "../../TestFactory";
import {ContextTest} from "../../ContextTest";
import {PostID} from "@connect/api-client";
import {get} from "../PostMethods";

describe("get", () => {
  test("does not get a post which does not exist", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await get(ctx, {id: -42 as PostID})).toEqual({post: null});
      });
    });
  });

  test("will get a post", () => {
    return ContextTest.with(async ctx => {
      const post = await createPost(ctx);
      const groupMember = await createGroupMember(ctx, {groupID: post.groupID});

      await ctx.withAuthorized(groupMember.accountID, async ctx => {
        expect(await get(ctx, {id: post.id})).toEqual({post});
      });
    });
  });

  test("will not get a post in a group our account is not a member of", () => {
    return ContextTest.with(async ctx => {
      const post = await createPost(ctx);
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await get(ctx, {id: post.id})).toEqual({post: null});
      });
    });
  });
});
