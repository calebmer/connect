import {DateTime, PostCursor, RangeDirection} from "@connect/api-client";
import {
  createAccount,
  createGroup,
  createGroupMember,
  createPost,
} from "../../TestFactory";
import {getBySlug, getPosts} from "../GroupMethods";
import {ContextTest} from "../../ContextTest";

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

describe("getBySlug", () => {
  test("does not return a group that does not exist", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getBySlug(ctx, {slug: "nope"})).toEqual({group: null});
      });
    });
  });

  test("does return a group the account is a member of", () => {
    return ContextTest.with(async ctx => {
      const group = await createGroup(ctx);
      const groupMember = await createGroupMember(ctx, {groupID: group.id});

      await ctx.withAuthorized(groupMember.accountID, async ctx => {
        expect(await getBySlug(ctx, {slug: group.slug})).toEqual({group});
      });
    });
  });

  test("does not return a group if the account is not a member", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getBySlug(ctx, {slug: group.slug})).toEqual({group: null});
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
        expect(await getBySlug(ctx, {slug: group.slug})).toEqual({group: null});
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
        expect(await getBySlug(ctx, {slug: group.slug})).toEqual({group: null});
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
        expect(await getBySlug(ctx, {slug: group.slug})).toEqual({group: null});
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
        expect(await getBySlug(ctx, {slug: group.slug})).toEqual({group});
      });
    });
  });
});

describe("getPosts", () => {
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
          await getPosts(ctx, {
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
          await getPosts(ctx, {
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
          await getPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.First,
            count: 3,
            after: PostCursor.get(posts1[0]),
            before: null,
          }),
        ).toEqual({posts: [posts1[1], posts1[2], posts1[3]]});
        expect(
          await getPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.Last,
            count: 3,
            after: PostCursor.get(posts1[0]),
            before: null,
          }),
        ).toEqual({posts: [posts1[2], posts1[3], posts1[4]]});
        expect(
          await getPosts(ctx, {
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
          await getPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.Last,
            count: 3,
            after: null,
            before: PostCursor.get(posts1[4]),
          }),
        ).toEqual({posts: [posts1[1], posts1[2], posts1[3]]});
        expect(
          await getPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.First,
            count: 3,
            after: null,
            before: PostCursor.get(posts1[4]),
          }),
        ).toEqual({posts: [posts1[0], posts1[1], posts1[2]]});
        expect(
          await getPosts(ctx, {
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
          await getPosts(ctx, {
            groupID: group1.id,
            direction: RangeDirection.First,
            count: 5,
            after: PostCursor.get(posts1[0]),
            before: PostCursor.get(posts1[4]),
          }),
        ).toEqual({posts: [posts1[1], posts1[2], posts1[3]]});
        expect(
          await getPosts(ctx, {
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
          await getPosts(ctx, {
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
          await getPosts(ctx, {
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
          await getPosts(ctx, {
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
          await getPosts(ctx, {
            groupID: group.id,
            direction: RangeDirection.Last,
            count: 3,
            after: null,
            before: PostCursor.get(post3),
          }),
        ).toEqual({posts: [post1, post2]});
        expect(
          await getPosts(ctx, {
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
