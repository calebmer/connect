import {
  APIError,
  APIErrorCode,
  CommentID,
  generateID,
} from "@connect/api-client";
import {
  createAccount,
  createComment,
  createGroupMember,
  createPost,
} from "../../TestFactory";
import {getComment, getPostComments, publishComment} from "../CommentMethods";
import {ContextTest} from "../../ContextTest";
import {getPost} from "../PostMethods";

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
            limit: 3,
            offset: 0,
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
            limit: 3,
            offset: 0,
          }),
        ).toEqual({comments: [comment1, comment2, comment3]});
      });
    });
  });

  test("gets comments from a post in a group we are in with an offset", () => {
    return ContextTest.with(async ctx => {
      const {accountID, groupID} = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID});

      await createComment(ctx, {postID: post.id});
      await createComment(ctx, {postID: post.id});
      const comment3 = await createComment(ctx, {postID: post.id});
      const comment4 = await createComment(ctx, {postID: post.id});
      await createComment(ctx, {postID: post.id});

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getPostComments(ctx, {
            postID: post.id,
            limit: 2,
            offset: 2,
          }),
        ).toEqual({comments: [comment3, comment4]});
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
            limit: 3,
            offset: 0,
          }),
        ).toEqual({comments: []});
      });
    });
  });
});

describe("publishComment", () => {
  test("will not publish a comment to a post that does not exist", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        let error: any;
        try {
          await publishComment(ctx, {
            id: generateID(),
            postID: generateID(),
            content: "test",
          });
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.UNAUTHORIZED);
      });
    });
  });

  test("will not publish a comment to a post in a group the account is not a member of", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const post = await createPost(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        let error: any;
        try {
          await publishComment(ctx, {
            id: generateID(),
            postID: post.id,
            content: "test",
          });
        } catch (e) {
          error = e;
        }
        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.UNAUTHORIZED);
      });
    });
  });

  test("will publish a comment to a post in a group the account is a member of", () => {
    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID: membership.groupID});

      await ctx.withAuthorized(membership.accountID, async ctx => {
        const commentID = generateID<CommentID>();

        const {publishedAt} = await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content: "test",
        });

        const {comment} = await getComment(ctx, {id: commentID});

        expect(comment).toEqual({
          id: commentID,
          postID: post.id,
          authorID: membership.accountID,
          publishedAt,
          content: "test",
        });
      });
    });
  });

  test("will publish a comment on a post authored by yourself", () => {
    return ContextTest.with(async ctx => {
      const post = await createPost(ctx);

      await ctx.withAuthorized(post.authorID, async ctx => {
        const commentID = generateID<CommentID>();

        const {publishedAt} = await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content: "test",
        });

        const {comment} = await getComment(ctx, {id: commentID});

        expect(comment).toEqual({
          id: commentID,
          postID: post.id,
          authorID: post.authorID,
          publishedAt,
          content: "test",
        });
      });
    });
  });

  test("will not publish if the author ID is not the current account", () => {
    return ContextTest.with(async ctx => {
      const post = await createPost(ctx);
      const membership1 = await createGroupMember(ctx, {groupID: post.groupID});
      const membership2 = await createGroupMember(ctx, {groupID: post.groupID});

      await ctx.withAuthorized(membership1.accountID, async ctx => {
        // Hack: simulate providing a different author ID to `publishPost`. This
        // is mostly testing our database policy. It should never be possible
        // to change the context’s account ID in our API.
        (ctx as any).accountID = membership2.accountID;

        let error: any;
        try {
          await publishComment(ctx, {
            id: generateID(),
            postID: post.id,
            content: "test",
          });
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.UNAUTHORIZED);
      });
    });
  });

  test("will not publish a comment with no content", () => {
    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID: membership.groupID});

      await ctx.withAuthorized(membership.accountID, async ctx => {
        let error: any;
        try {
          await publishComment(ctx, {
            id: generateID(),
            postID: post.id,
            content: "",
          });
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.BAD_INPUT);
      });
    });
  });

  test("will not publish a comment with only spaces", () => {
    const content = "    ";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID: membership.groupID});

      await ctx.withAuthorized(membership.accountID, async ctx => {
        let error: any;
        try {
          await publishComment(ctx, {
            id: generateID(),
            postID: post.id,
            content,
          });
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.BAD_INPUT);
      });
    });
  });

  test("will not publish a comment with only whitespace", () => {
    const content = "  \n   \n\n  \n   \t \r    \n\r  \r\n ";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID: membership.groupID});

      await ctx.withAuthorized(membership.accountID, async ctx => {
        let error: any;
        try {
          await publishComment(ctx, {
            id: generateID(),
            postID: post.id,
            content,
          });
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.BAD_INPUT);
      });
    });
  });

  test("will not publish two comments with the same ID in the same group", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const post = await createPost(ctx);
      const comment = await createComment(ctx, {postID: post.id});

      await createGroupMember(ctx, {
        accountID: account.id,
        groupID: post.groupID,
      });

      await ctx.withAuthorized(account.id, async ctx => {
        let error: any;
        try {
          await publishComment(ctx, {
            id: comment.id,
            postID: comment.postID,
            content: "test",
          });
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.ALREADY_EXISTS);
      });
    });
  });

  test("will not publish two comments with the same ID in different groups", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const post = await createPost(ctx);
      const comment = await createComment(ctx);

      await createGroupMember(ctx, {
        accountID: account.id,
        groupID: post.groupID,
      });

      await ctx.withAuthorized(account.id, async ctx => {
        let error: any;
        try {
          await publishComment(ctx, {
            id: comment.id,
            postID: post.id,
            content: "test",
          });
        } catch (e) {
          error = e;
        }

        expect(error).toBeInstanceOf(APIError);
        expect(error.code).toBe(APIErrorCode.ALREADY_EXISTS);
      });
    });
  });

  test("trims whitespace from the front", () => {
    const content = " \n  test";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID: membership.groupID});

      await ctx.withAuthorized(membership.accountID, async ctx => {
        const commentID = generateID<CommentID>();

        await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content,
        });

        const {comment} = await getComment(ctx, {id: commentID});

        expect(comment!.content).toEqual("test");
      });
    });
  });

  test("trims whitespace from the back", () => {
    const content = "test \n  ";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID: membership.groupID});

      await ctx.withAuthorized(membership.accountID, async ctx => {
        const commentID = generateID<CommentID>();

        await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content,
        });

        const {comment} = await getComment(ctx, {id: commentID});

        expect(comment!.content).toEqual("test");
      });
    });
  });

  test("trims whitespace from the front and back", () => {
    const content = " \n  test \n  ";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID: membership.groupID});

      await ctx.withAuthorized(membership.accountID, async ctx => {
        const commentID = generateID<CommentID>();

        await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content,
        });

        const {comment} = await getComment(ctx, {id: commentID});

        expect(comment!.content).toEqual("test");
      });
    });
  });

  test("increments the post comment count once", () => {
    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);
      const {id: postID} = await createPost(ctx, {groupID: membership.groupID});

      await ctx.withAuthorized(membership.accountID, async ctx => {
        {
          const {post} = await getPost(ctx, {id: postID});
          expect(post!.commentCount).toEqual(0);
        }

        await publishComment(ctx, {
          id: generateID(),
          postID,
          content: "test",
        });

        {
          const {post} = await getPost(ctx, {id: postID});
          expect(post!.commentCount).toEqual(1);
        }
      });
    });
  });

  test("increments the post comment count thrice", () => {
    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);
      const {id: postID} = await createPost(ctx, {groupID: membership.groupID});

      await ctx.withAuthorized(membership.accountID, async ctx => {
        {
          const {post} = await getPost(ctx, {id: postID});
          expect(post!.commentCount).toEqual(0);
        }

        await publishComment(ctx, {
          id: generateID(),
          postID,
          content: "test",
        });
        await publishComment(ctx, {
          id: generateID(),
          postID,
          content: "test",
        });
        await publishComment(ctx, {
          id: generateID(),
          postID,
          content: "test",
        });

        {
          const {post} = await getPost(ctx, {id: postID});
          expect(post!.commentCount).toEqual(3);
        }
      });
    });
  });
});
