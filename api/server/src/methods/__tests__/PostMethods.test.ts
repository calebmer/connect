import {PostID, RangeDirection} from "@connect/api-client";
import {
  createAccount,
  createComment,
  createGroupMember,
  createPost,
} from "../../TestFactory";
import {getPost, getPostComments} from "../PostMethods";
import {ContextTest} from "../../ContextTest";

describe("getPost", () => {
  test("does not get a post which does not exist", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getPost(ctx, {id: -42 as PostID})).toEqual({post: null});
      });
    });
  });

  test("will get a post", () => {
    return ContextTest.with(async ctx => {
      const post = await createPost(ctx);
      const groupMember = await createGroupMember(ctx, {groupID: post.groupID});

      await ctx.withAuthorized(groupMember.accountID, async ctx => {
        expect(await getPost(ctx, {id: post.id})).toEqual({post});
      });
    });
  });

  test("will not get a post in a group our account is not a member of", () => {
    return ContextTest.with(async ctx => {
      const post = await createPost(ctx);
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getPost(ctx, {id: post.id})).toEqual({post: null});
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
});
