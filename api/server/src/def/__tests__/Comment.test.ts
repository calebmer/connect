import {
  APIError,
  APIErrorCode,
  CommentID,
  PostCommentEvent,
  generateID,
} from "@connect/api-client";
import {
  createAccount,
  createComment,
  createGroupMember,
  createPost,
} from "../../TestFactory";
import {
  getComment,
  getPostComments,
  publishComment,
  watchPostComments,
} from "../Comment";
import {ContextTest} from "../../ContextTest";
import {getPost} from "../Post";
import {sql} from "../../pg/SQL";

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

  test("will automatically follow the post we commented on", () => {
    return ContextTest.with(async ctx => {
      const {accountID, groupID} = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID});

      const {rowCount: rowCount1} = await ctx.query(sql`
        SELECT 1
          FROM post_follower
         WHERE account_id = ${accountID} AND
               post_id = ${post.id}
      `);
      expect(rowCount1).toEqual(0);

      await ctx.withAuthorized(accountID, async ctx => {
        await publishComment(ctx, {
          id: generateID(),
          postID: post.id,
          content: "test",
        });
      });

      const {rowCount: rowCount2} = await ctx.query(sql`
        SELECT 1
          FROM post_follower
         WHERE account_id = ${accountID} AND
               post_id = ${post.id}
      `);
      expect(rowCount2).toEqual(1);
    });
  });

  test("will not follow a comment published by someone else", () => {
    return ContextTest.with(async ctx => {
      const {accountID, groupID} = await createGroupMember(ctx);
      const {accountID: accountID2} = await createGroupMember(ctx, {groupID});
      const post = await createPost(ctx, {groupID});

      const {rowCount: rowCount1} = await ctx.query(sql`
        SELECT 1
          FROM post_follower
         WHERE account_id = ${accountID2} AND
               post_id = ${post.id}
      `);
      expect(rowCount1).toEqual(0);

      await ctx.withAuthorized(accountID, async ctx => {
        await publishComment(ctx, {
          id: generateID(),
          postID: post.id,
          content: "test",
        });
      });

      const {rowCount: rowCount2} = await ctx.query(sql`
        SELECT 1
          FROM post_follower
         WHERE account_id = ${accountID2} AND
               post_id = ${post.id}
      `);
      expect(rowCount2).toEqual(0);
    });
  });

  test("will only follow the post we commented on once if there are multiple comments", () => {
    return ContextTest.with(async ctx => {
      const {accountID, groupID} = await createGroupMember(ctx);
      const post = await createPost(ctx, {groupID});

      const {rowCount: rowCount1} = await ctx.query(sql`
        SELECT 1
          FROM post_follower
         WHERE account_id = ${accountID} AND
               post_id = ${post.id}
      `);
      expect(rowCount1).toEqual(0);

      await ctx.withAuthorized(accountID, async ctx => {
        await publishComment(ctx, {
          id: generateID(),
          postID: post.id,
          content: "test",
        });
        await publishComment(ctx, {
          id: generateID(),
          postID: post.id,
          content: "test",
        });
        await publishComment(ctx, {
          id: generateID(),
          postID: post.id,
          content: "test",
        });
      });

      const {rowCount: rowCount2} = await ctx.query(sql`
        SELECT 1
          FROM post_follower
         WHERE account_id = ${accountID} AND
               post_id = ${post.id}
      `);
      expect(rowCount2).toEqual(1);
    });
  });
});

describe("watchPostComments", () => {
  function wait(ms: number) {
    return new Promise<void>(resolve => setTimeout(resolve, ms));
  }

  test("will throw an error if the account is not authorized to see the post", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const post = await createPost(ctx);

      let error: any;
      try {
        const unwatch = await watchPostComments(
          ctx.withSubscription(account.id, () => {
            throw new Error("Unexpected");
          }),
          {postID: post.id},
        );
        await unwatch();
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toEqual(APIErrorCode.UNAUTHORIZED);
    });
  });

  test("will not throw if the account is authorized to see the post", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account.id,
        groupID: post.groupID,
      });

      const logs: Array<PostCommentEvent> = [];

      const unwatch = await watchPostComments(
        ctx.withSubscription(account.id, event => {
          logs.push(event);
        }),
        {postID: post.id},
      );

      await unwatch();

      expect(logs).toEqual([{type: "count", commentCount: 0}]);
    });
  });

  test("will see a comment published by ourself", () => {
    return ContextTest.with(async ctx => {
      const commentID = generateID<CommentID>();

      const account = await createAccount(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account.id,
        groupID: post.groupID,
      });

      const logs: Array<PostCommentEvent> = [];

      const unwatch = await watchPostComments(
        ctx.withSubscription(account.id, event => {
          logs.push(event);
        }),
        {postID: post.id},
      );

      await ctx.withAuthorized(account.id, async ctx => {
        await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content: "test",
        });
      });

      await wait(20);
      await unwatch();

      expect(logs).toEqual([
        {type: "count", commentCount: 0},
        {type: "new", comment: expect.objectContaining({id: commentID})},
      ]);
    });
  });

  test("will see a comment published by someone else", () => {
    return ContextTest.with(async ctx => {
      const commentID = generateID<CommentID>();

      const account1 = await createAccount(ctx);
      const account2 = await createAccount(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account1.id,
        groupID: post.groupID,
      });
      await createGroupMember(ctx, {
        accountID: account2.id,
        groupID: post.groupID,
      });

      const logs: Array<PostCommentEvent> = [];

      const unwatch = await watchPostComments(
        ctx.withSubscription(account1.id, event => {
          logs.push(event);
        }),
        {postID: post.id},
      );

      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content: "test",
        });
      });

      await wait(20);
      await unwatch();

      expect(logs).toEqual([
        {type: "count", commentCount: 0},
        {type: "new", comment: expect.objectContaining({id: commentID})},
      ]);
    });
  });

  test("will see three comments published by someone else", () => {
    return ContextTest.with(async ctx => {
      const commentID1 = generateID<CommentID>();
      const commentID2 = generateID<CommentID>();
      const commentID3 = generateID<CommentID>();

      const account1 = await createAccount(ctx);
      const account2 = await createAccount(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account1.id,
        groupID: post.groupID,
      });
      await createGroupMember(ctx, {
        accountID: account2.id,
        groupID: post.groupID,
      });

      const logs: Array<PostCommentEvent> = [];

      const unwatch = await watchPostComments(
        ctx.withSubscription(account1.id, event => {
          logs.push(event);
        }),
        {postID: post.id},
      );

      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: commentID1,
          postID: post.id,
          content: "test 1",
        });
      });
      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: commentID2,
          postID: post.id,
          content: "test 2",
        });
      });
      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: commentID3,
          postID: post.id,
          content: "test 3",
        });
      });

      await wait(20);
      await unwatch();

      expect(logs).toEqual([
        {type: "count", commentCount: 0},
        {type: "new", comment: expect.objectContaining({id: commentID1})},
        {type: "new", comment: expect.objectContaining({id: commentID2})},
        {type: "new", comment: expect.objectContaining({id: commentID3})},
      ]);
    });
  });

  test("will not see a comment after unwatching", () => {
    return ContextTest.with(async ctx => {
      const commentID = generateID<CommentID>();

      const account1 = await createAccount(ctx);
      const account2 = await createAccount(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account1.id,
        groupID: post.groupID,
      });
      await createGroupMember(ctx, {
        accountID: account2.id,
        groupID: post.groupID,
      });

      const logs: Array<PostCommentEvent> = [];

      const unwatch = await watchPostComments(
        ctx.withSubscription(account1.id, event => {
          logs.push(event);
        }),
        {postID: post.id},
      );

      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content: "test 1",
        });
      });

      await wait(20);
      await unwatch();

      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: generateID(),
          postID: post.id,
          content: "test 2",
        });
      });

      await wait(20);

      expect(logs).toEqual([
        {type: "count", commentCount: 0},
        {type: "new", comment: expect.objectContaining({id: commentID})},
      ]);
    });
  });

  test("will not see a comment before watching", () => {
    return ContextTest.with(async ctx => {
      const commentID = generateID<CommentID>();

      const account1 = await createAccount(ctx);
      const account2 = await createAccount(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account1.id,
        groupID: post.groupID,
      });
      await createGroupMember(ctx, {
        accountID: account2.id,
        groupID: post.groupID,
      });

      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: generateID(),
          postID: post.id,
          content: "test 1",
        });
      });

      const logs: Array<PostCommentEvent> = [];

      const unwatch = await watchPostComments(
        ctx.withSubscription(account1.id, event => {
          logs.push(event);
        }),
        {postID: post.id},
      );

      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content: "test 2",
        });
      });

      await wait(20);
      await unwatch();

      expect(logs).toEqual([
        {type: "count", commentCount: 1},
        {type: "new", comment: expect.objectContaining({id: commentID})},
      ]);
    });
  });

  test("will not see a comment before watching and after unwatching", () => {
    return ContextTest.with(async ctx => {
      const commentID = generateID<CommentID>();

      const account1 = await createAccount(ctx);
      const account2 = await createAccount(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account1.id,
        groupID: post.groupID,
      });
      await createGroupMember(ctx, {
        accountID: account2.id,
        groupID: post.groupID,
      });

      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: generateID(),
          postID: post.id,
          content: "test 1",
        });
      });

      const logs: Array<PostCommentEvent> = [];

      const unwatch = await watchPostComments(
        ctx.withSubscription(account1.id, event => {
          logs.push(event);
        }),
        {postID: post.id},
      );

      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content: "test 2",
        });
      });

      await wait(20);
      await unwatch();

      await ctx.withAuthorized(account2.id, async ctx => {
        await publishComment(ctx, {
          id: generateID(),
          postID: post.id,
          content: "test 3",
        });
      });

      await wait(20);

      expect(logs).toEqual([
        {type: "count", commentCount: 1},
        {type: "new", comment: expect.objectContaining({id: commentID})},
      ]);
    });
  });

  test("will listen twice in parallel and then unlisten", () => {
    return ContextTest.with(async ctx => {
      const commentID = generateID<CommentID>();

      const account1 = await createAccount(ctx);
      const account2 = await createAccount(ctx);
      const account3 = await createAccount(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account1.id,
        groupID: post.groupID,
      });
      await createGroupMember(ctx, {
        accountID: account2.id,
        groupID: post.groupID,
      });
      await createGroupMember(ctx, {
        accountID: account3.id,
        groupID: post.groupID,
      });

      const logs1: Array<PostCommentEvent> = [];
      const logs2: Array<PostCommentEvent> = [];

      const [unwatch1, unwatch2] = await Promise.all([
        watchPostComments(
          ctx.withSubscription(account1.id, event => {
            logs1.push(event);
          }),
          {postID: post.id},
        ),
        watchPostComments(
          ctx.withSubscription(account2.id, event => {
            logs2.push(event);
          }),
          {postID: post.id},
        ),
      ]);

      await ctx.withAuthorized(account3.id, async ctx => {
        await publishComment(ctx, {
          id: commentID,
          postID: post.id,
          content: "test 1",
        });
      });

      await wait(20);
      await unwatch1();
      await unwatch2();

      await ctx.withAuthorized(account3.id, async ctx => {
        await publishComment(ctx, {
          id: generateID(),
          postID: post.id,
          content: "test 2",
        });
      });

      await wait(20);

      expect(logs1).toEqual([
        {type: "count", commentCount: 0},
        {type: "new", comment: expect.objectContaining({id: commentID})},
      ]);

      expect(logs2).toEqual([
        {type: "count", commentCount: 0},
        {type: "new", comment: expect.objectContaining({id: commentID})},
      ]);
    });
  });

  test("will not send a comment if an account’s group membership was revoked", () => {
    return ContextTest.with(async ctx => {
      const commentID1 = generateID<CommentID>();
      const commentID2 = generateID<CommentID>();

      const account1 = await createAccount(ctx);
      const account2 = await createAccount(ctx);
      const account3 = await createAccount(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account1.id,
        groupID: post.groupID,
      });
      await createGroupMember(ctx, {
        accountID: account2.id,
        groupID: post.groupID,
      });
      await createGroupMember(ctx, {
        accountID: account3.id,
        groupID: post.groupID,
      });

      const logs1: Array<PostCommentEvent> = [];
      const logs2: Array<PostCommentEvent> = [];

      const unwatch1 = await watchPostComments(
        ctx.withSubscription(account1.id, event => {
          logs1.push(event);
        }),
        {postID: post.id},
      );

      const unwatch2 = await watchPostComments(
        ctx.withSubscription(account2.id, event => {
          logs2.push(event);
        }),
        {postID: post.id},
      );

      await ctx.withAuthorized(account3.id, async ctx => {
        await publishComment(ctx, {
          id: commentID1,
          postID: post.id,
          content: "test 1",
        });
      });

      const {rowCount} = await ctx.query(sql`
        DELETE FROM group_member
        WHERE account_id = ${account1.id} AND group_id = ${post.groupID}
      `);
      expect(rowCount).toEqual(1);

      await ctx.withAuthorized(account3.id, async ctx => {
        await publishComment(ctx, {
          id: commentID2,
          postID: post.id,
          content: "test 2",
        });
      });

      await ctx.withAuthorized(account1.id, async ctx => {
        const {post: fetchedPost} = await getPost(ctx, {id: post.id});
        expect(fetchedPost).toEqual(null);

        const {comment} = await getComment(ctx, {id: commentID2});
        expect(comment).toEqual(null);
      });

      await wait(20);
      await unwatch1();
      await unwatch2();

      expect(logs1).toEqual([
        {type: "count", commentCount: 0},
        {type: "new", comment: expect.objectContaining({id: commentID1})},
      ]);

      expect(logs2).toEqual([
        {type: "count", commentCount: 0},
        {type: "new", comment: expect.objectContaining({id: commentID1})},
        {type: "new", comment: expect.objectContaining({id: commentID2})},
      ]);
    });
  });
});
