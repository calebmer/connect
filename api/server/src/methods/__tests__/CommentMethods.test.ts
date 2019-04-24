import {RangeDirection, generateID} from "@connect/api-client";
import {
  createAccount,
  createComment,
  createGroupMember,
  createPost,
} from "../../TestFactory";
import {getComment, getPostComments} from "../CommentMethods";
import {ContextTest} from "../../ContextTest";

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

describe("getPostComments", () => {
  test("does not get comments from a post in a group we are not in", () => {
    return ContextTest.with(async ctx => {
      const post = await createPost(ctx);
      const {accountID} = await createGroupMember(ctx);

      await createComment(ctx, {postID: post.id});
      await createComment(ctx, {postID: post.id});
      await createComment(ctx, {postID: post.id});
      await createComment(ctx, {postID: post.id});
      await createComment(ctx, {postID: post.id});

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getPostComments(ctx, {
            postID: post.id,
            direction: RangeDirection.First,
            count: 3,
            after: null,
            before: null,
          }),
        ).toEqual({comments: []});
      });
    });
  });

  test("gets comments from a post in a group we are in", () => {
    return ContextTest.with(async ctx => {
      const {accountID, groupID} = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID});

      const comment1 = await createComment(ctx, {postID: post.id});
      const comment2 = await createComment(ctx, {postID: post.id});
      const comment3 = await createComment(ctx, {postID: post.id});
      await createComment(ctx, {postID: post.id});
      await createComment(ctx, {postID: post.id});

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getPostComments(ctx, {
            postID: post.id,
            direction: RangeDirection.First,
            count: 3,
            after: null,
            before: null,
          }),
        ).toEqual({comments: [comment1, comment2, comment3]});
      });
    });
  });

  test("gets an empty list if the post does not exist", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(
          await getPostComments(ctx, {
            postID: generateID(),
            direction: RangeDirection.First,
            count: 3,
            after: null,
            before: null,
          }),
        ).toEqual({comments: []});
      });
    });
  });
});
