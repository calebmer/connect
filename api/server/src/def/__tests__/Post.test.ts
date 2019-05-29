import {
  APIError,
  APIErrorCode,
  DateTime,
  PostCursor,
  PostID,
  RangeDirection,
  generateID,
} from "@connect/api-client";
import {
  createAccount,
  createGroup,
  createGroupMember,
  createPost,
} from "../../TestFactory";
import {getGroupPosts, getPost, publishPost} from "../Post";
import {ContextTest} from "../../ContextTest";

describe("getPost", () => {
  test("does not get a post which does not exist", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getPost(ctx, {id: generateID()})).toEqual({
          post: null,
        });
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

describe("getGroupPosts", () => {
  /**
   * Executes the `make()` function serially so that we get predictable outcomes.
   */
  async function arrayMake<T>(
    length: number,
    make: (i: number) => Promise<T>,
  ): Promise<Array<T>> {
    const array = Array(length);
    for (let i = 0; i < length; i++) {
      array[i] = await make(i);
    }
    return array;
  }

  test("gets the first 3 posts in a group", () => {
    return ContextTest.with(async ctx => {
      const accountID = (await createAccount(ctx)).id;
      const group1 = await createGroup(ctx);
      const group2 = await createGroup(ctx);
      const group3 = await createGroup(ctx);
      await createGroupMember(ctx, {accountID, groupID: group1.id});
      await createGroupMember(ctx, {accountID, groupID: group2.id});

      const [posts1] = await Promise.all([
        arrayMake(4, () => createPost(ctx, {groupID: group1.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group2.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group3.id})),
      ]);

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.First,
            count: 3,
            after: null,
            before: null,
          }),
        ).toEqual({posts: [posts1[3], posts1[2], posts1[1]]});
      });
    });
  });

  test("gets the last 3 posts in a group", () => {
    return ContextTest.with(async ctx => {
      const accountID = (await createAccount(ctx)).id;
      const group1 = await createGroup(ctx);
      const group2 = await createGroup(ctx);
      const group3 = await createGroup(ctx);
      await createGroupMember(ctx, {accountID, groupID: group1.id});
      await createGroupMember(ctx, {accountID, groupID: group2.id});

      const [posts1] = await Promise.all([
        arrayMake(4, () => createPost(ctx, {groupID: group1.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group2.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group3.id})),
      ]);

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.Last,
            count: 3,
            after: null,
            before: null,
          }),
        ).toEqual({posts: [posts1[2], posts1[1], posts1[0]]});
      });
    });
  });

  test("gets the posts after a cursor", () => {
    return ContextTest.with(async ctx => {
      const accountID = (await createAccount(ctx)).id;
      const group1 = await createGroup(ctx);
      const group2 = await createGroup(ctx);
      const group3 = await createGroup(ctx);
      await createGroupMember(ctx, {accountID, groupID: group1.id});
      await createGroupMember(ctx, {accountID, groupID: group2.id});

      const [posts1] = await Promise.all([
        arrayMake(5, () => createPost(ctx, {groupID: group1.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group2.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group3.id})),
      ]);

      // Makes the tests easier to think about. The latest posts are
      // returned first.
      posts1.reverse();

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.First,
            count: 3,
            after: PostCursor.get(posts1[0]),
            before: null,
          }),
        ).toEqual({posts: [posts1[1], posts1[2], posts1[3]]});
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.Last,
            count: 3,
            after: PostCursor.get(posts1[0]),
            before: null,
          }),
        ).toEqual({posts: [posts1[2], posts1[3], posts1[4]]});
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.Last,
            count: 5,
            after: PostCursor.get(posts1[0]),
            before: null,
          }),
        ).toEqual({posts: [posts1[1], posts1[2], posts1[3], posts1[4]]});
      });
    });
  });

  test("gets the posts before a cursor", () => {
    return ContextTest.with(async ctx => {
      const accountID = (await createAccount(ctx)).id;
      const group1 = await createGroup(ctx);
      const group2 = await createGroup(ctx);
      const group3 = await createGroup(ctx);
      await createGroupMember(ctx, {accountID, groupID: group1.id});
      await createGroupMember(ctx, {accountID, groupID: group2.id});

      const [posts1] = await Promise.all([
        arrayMake(5, () => createPost(ctx, {groupID: group1.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group2.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group3.id})),
      ]);

      // Makes the tests easier to think about. The latest posts are
      // returned first.
      posts1.reverse();

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.Last,
            count: 3,
            after: null,
            before: PostCursor.get(posts1[4]),
          }),
        ).toEqual({posts: [posts1[1], posts1[2], posts1[3]]});
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.First,
            count: 3,
            after: null,
            before: PostCursor.get(posts1[4]),
          }),
        ).toEqual({posts: [posts1[0], posts1[1], posts1[2]]});
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.First,
            count: 5,
            after: null,
            before: PostCursor.get(posts1[4]),
          }),
        ).toEqual({posts: [posts1[0], posts1[1], posts1[2], posts1[3]]});
      });
    });
  });

  test("gets the posts between two cursor", () => {
    return ContextTest.with(async ctx => {
      const accountID = (await createAccount(ctx)).id;
      const group1 = await createGroup(ctx);
      const group2 = await createGroup(ctx);
      const group3 = await createGroup(ctx);
      await createGroupMember(ctx, {accountID, groupID: group1.id});
      await createGroupMember(ctx, {accountID, groupID: group2.id});

      const [posts1] = await Promise.all([
        arrayMake(5, () => createPost(ctx, {groupID: group1.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group2.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group3.id})),
      ]);

      // Makes the tests easier to think about. The latest posts are
      // returned first.
      posts1.reverse();

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.First,
            count: 5,
            after: PostCursor.get(posts1[0]),
            before: PostCursor.get(posts1[4]),
          }),
        ).toEqual({posts: [posts1[1], posts1[2], posts1[3]]});
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.Last,
            count: 5,
            after: PostCursor.get(posts1[0]),
            before: PostCursor.get(posts1[4]),
          }),
        ).toEqual({posts: [posts1[1], posts1[2], posts1[3]]});
      });
    });
  });

  test("gets no posts", () => {
    return ContextTest.with(async ctx => {
      const accountID = (await createAccount(ctx)).id;
      const group1 = await createGroup(ctx);
      const group2 = await createGroup(ctx);
      const group3 = await createGroup(ctx);
      await createGroupMember(ctx, {accountID, groupID: group1.id});
      await createGroupMember(ctx, {accountID, groupID: group2.id});

      await Promise.all([
        arrayMake(2, () => createPost(ctx, {groupID: group2.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group3.id})),
      ]);

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.First,
            count: 3,
            after: null,
            before: null,
          }),
        ).toEqual({posts: []});
      });
    });
  });

  test("gets one posts", () => {
    return ContextTest.with(async ctx => {
      const accountID = (await createAccount(ctx)).id;
      const group1 = await createGroup(ctx);
      const group2 = await createGroup(ctx);
      const group3 = await createGroup(ctx);
      await createGroupMember(ctx, {accountID, groupID: group1.id});
      await createGroupMember(ctx, {accountID, groupID: group2.id});

      const [posts1] = await Promise.all([
        arrayMake(1, () => createPost(ctx, {groupID: group1.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group2.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group3.id})),
      ]);

      // Makes the tests easier to think about. The latest posts are
      // returned first.
      posts1.reverse();

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getGroupPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.First,
            count: 3,
            after: null,
            before: null,
          }),
        ).toEqual({posts: [posts1[0]]});
      });
    });
  });

  test("does not return posts from group account is not a member of", () => {
    return ContextTest.with(async ctx => {
      const account1 = await createAccount(ctx);
      const account2 = await createAccount(ctx);
      const group1 = await createGroup(ctx);
      const group2 = await createGroup(ctx);
      const group3 = await createGroup(ctx);
      await createGroupMember(ctx, {
        accountID: account1.id,
        groupID: group1.id,
      });
      await createGroupMember(ctx, {
        accountID: account1.id,
        groupID: group2.id,
      });
      await createGroupMember(ctx, {
        accountID: account2.id,
        groupID: group2.id,
      });
      await createGroupMember(ctx, {
        accountID: account2.id,
        groupID: group3.id,
      });

      await Promise.all([
        arrayMake(2, () => createPost(ctx, {groupID: group1.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group2.id})),
        arrayMake(2, () => createPost(ctx, {groupID: group3.id})),
      ]);

      await ctx.withAuthorized(account1.id, async ctx => {
        expect(
          await getGroupPosts(ctx, {
            groupID: group3.id,
            direction: RangeDirection.First,
            count: 3,
            after: null,
            before: null,
          }),
        ).toEqual({posts: []});
      });
    });
  });

  test("correctly uses cursors to select posts with the same publish time", () => {
    return ContextTest.with(async ctx => {
      const group = await createGroup(ctx);
      const {accountID} = await createGroupMember(ctx, {groupID: group.id});
      const publishedAt = new Date().toISOString() as DateTime;
      const post5 = await createPost(ctx, {groupID: group.id, publishedAt});
      const post4 = await createPost(ctx, {groupID: group.id, publishedAt});
      const post3 = await createPost(ctx, {groupID: group.id, publishedAt});
      const post2 = await createPost(ctx, {groupID: group.id, publishedAt});
      const post1 = await createPost(ctx, {groupID: group.id, publishedAt});

      await ctx.withAuthorized(accountID, async ctx => {
        expect(
          await getGroupPosts(ctx, {
            groupID: group.id,
            direction: RangeDirection.Last,
            count: 3,
            after: null,
            before: PostCursor.get(post3),
          }),
        ).toEqual({posts: [post1, post2]});
        expect(
          await getGroupPosts(ctx, {
            groupID: group.id,
            direction: RangeDirection.First,
            count: 3,
            after: PostCursor.get(post3),
            before: null,
          }),
        ).toEqual({posts: [post4, post5]});
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
          await publishPost(ctx, {
            id: generateID(),
            groupID: generateID(),
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

  test("will not publish a post to a group the account is not a member of", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {
            id: generateID(),
            groupID: group.id,
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

  test("will publish a post to a group the account is a member of", () => {
    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);

      await ctx.withAuthorized(membership.accountID, async ctx => {
        const postID = generateID<PostID>();

        const {publishedAt} = await publishPost(ctx, {
          id: postID,
          groupID: membership.groupID,
          content: "test",
        });

        const {post} = await getPost(ctx, {id: postID});

        expect(post).toEqual({
          id: postID,
          groupID: membership.groupID,
          authorID: membership.accountID,
          publishedAt,
          commentCount: 0,
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
          await publishPost(ctx, {
            id: generateID(),
            groupID: group.id,
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

  test("will not publish a post with no content", () => {
    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);

      await ctx.withAuthorized(membership.accountID, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {
            id: generateID(),
            groupID: membership.groupID,
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

  test("will not publish a post with only spaces", () => {
    const content = "    ";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);

      await ctx.withAuthorized(membership.accountID, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {
            id: generateID(),
            groupID: membership.groupID,
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

  test("will not publish a post with only whitespace", () => {
    const content = "  \n   \n\n  \n   \t \r    \n\r  \r\n ";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);

      await ctx.withAuthorized(membership.accountID, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {
            id: generateID(),
            groupID: membership.groupID,
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

  test("will not publish two posts with the same ID in the same group", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account.id,
        groupID: post.groupID,
      });

      await ctx.withAuthorized(account.id, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {
            id: post.id,
            groupID: post.groupID,
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

  test("will not publish two posts with the same ID in different groups", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);
      const post = await createPost(ctx);

      await createGroupMember(ctx, {
        accountID: account.id,
        groupID: group.id,
      });

      await ctx.withAuthorized(account.id, async ctx => {
        let error: any;
        try {
          await publishPost(ctx, {
            id: post.id,
            groupID: group.id,
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

      await ctx.withAuthorized(membership.accountID, async ctx => {
        const postID = generateID<PostID>();

        await publishPost(ctx, {
          id: postID,
          groupID: membership.groupID,
          content,
        });

        const {post} = await getPost(ctx, {id: postID});

        expect(post!.content).toEqual("test");
      });
    });
  });

  test("trims whitespace from the back", () => {
    const content = "test \n  ";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);

      await ctx.withAuthorized(membership.accountID, async ctx => {
        const postID = generateID<PostID>();

        await publishPost(ctx, {
          id: postID,
          groupID: membership.groupID,
          content,
        });

        const {post} = await getPost(ctx, {id: postID});

        expect(post!.content).toEqual("test");
      });
    });
  });

  test("trims whitespace from the front and back", () => {
    const content = " \n  test \n  ";

    return ContextTest.with(async ctx => {
      const membership = await createGroupMember(ctx);

      await ctx.withAuthorized(membership.accountID, async ctx => {
        const postID = generateID<PostID>();

        await publishPost(ctx, {
          id: postID,
          groupID: membership.groupID,
          content,
        });

        const {post} = await getPost(ctx, {id: postID});

        expect(post!.content).toEqual("test");
      });
    });
  });
});
