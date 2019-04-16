import {
  APIError,
  APIErrorCode,
  GroupID,
  PostID,
  RangeDirection,
} from "@connect/api-client";
import {
  createAccount,
  createComment,
  createGroup,
  createGroupMember,
  createPost,
} from "../../TestFactory";
import {getPost, getPostComments, publishPost} from "../PostMethods";
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

describe("publishPost", () => {
  test("will not publish a post to a group that does not exist", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {groupID: 1 as GroupID, content: "test"});
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.UNAUTHORIZED);
      });
    });
  });

  test("will not publish a post to a group the account is not a member of", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {groupID: group.id, content: "test"});
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.UNAUTHORIZED);
      });
    });
  });

  test("will publish a post to a group the account is a member of", () => {
    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);

      await ctx.withAuthorized(membership.accountID, async ctx => {
        const {postID} = await publishPost(ctx, {
          groupID: membership.groupID,
          content: "test",
        });

        const {post} = await getPost(ctx, {id: postID});

        expect(post).toEqual({
          id: postID,
          groupID: membership.groupID,
          authorID: membership.accountID,
          publishedAt: expect.anything(),
          content: "test",
        });
      });
    });
  });

  test("will not publish if the author ID is not the current account", () => {
    return ContextTest.with(async ctx => {
      const group = await createGroup(ctx);
      const membership1 = await createGroupMember(ctx, {groupID: group.id});
      const membership2 = await createGroupMember(ctx, {groupID: group.id});

      await ctx.withAuthorized(membership1.accountID, async ctx => {
        // Hack: simulate providing a different author ID to `publishPost`. This
        // is mostly testing our database policy. It should never be possible
        // to change the context’s account ID in our API.
        (ctx as any).accountID = membership2.accountID;

        let error: any;
        try {
          await publishPost(ctx, {groupID: group.id, content: "test"});
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.UNAUTHORIZED);
      });
    });
  });

  test("will not publish a post with no content", () => {
    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);

      await ctx.withAuthorized(membership.accountID, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {groupID: membership.groupID, content: ""});
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.BAD_INPUT);
      });
    });
  });

  test("will not publish a post with only spaces", () => {
    const content = "    ";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);

      await ctx.withAuthorized(membership.accountID, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {groupID: membership.groupID, content});
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.BAD_INPUT);
      });
    });
  });

  test("will not publish a post with only whitespace", () => {
    const content = "  \n   \n\n  \n   \t \r    \n\r  \r\n ";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);

      await ctx.withAuthorized(membership.accountID, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {groupID: membership.groupID, content});
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.BAD_INPUT);
      });
    });
  });
});
