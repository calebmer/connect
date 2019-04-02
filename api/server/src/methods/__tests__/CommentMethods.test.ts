import {
  createAccount,
  createComment,
  createGroupMember,
} from "../../TestFactory";
import {ContextTest} from "../../ContextTest";
import {getComment} from "../CommentMethods";

describe("getComment", () => {
  test("does not get a comment which does not exist", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getComment(ctx, {id: 42 as any})).toEqual({comment: null});
      });
    });
  });

  test("does not get a comment if the account is not in the same group", () => {
    return ContextTest.with(async ctx => {
      const {accountID} = await createGroupMember(ctx);
      const comment = await createComment(ctx);

      await ctx.withAuthorized(accountID, async ctx => {
        expect(await getComment(ctx, {id: comment.id})).toEqual({
          comment: null,
        });
      });
    });
  });

  test("gets a comment if the account is in the same group", () => {
    return ContextTest.with(async ctx => {
      const {accountID, groupID} = await createGroupMember(ctx);
      const comment = await createComment(ctx, {groupID});

      await ctx.withAuthorized(accountID, async ctx => {
        expect(await getComment(ctx, {id: comment.id})).toEqual({comment});
      });
    });
  });
});
