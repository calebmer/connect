import {
  APIError,
  APIErrorCode,
  RefreshToken,
  generateID,
} from "@connect/api-client";
import {createAccount, createGroup, createGroupMember} from "../../TestFactory";
import {
  getCurrentGroupMemberships,
  getCurrentProfile,
  getManyProfiles,
  getProfile,
  refreshAccessToken,
  signIn,
  signOut,
  signUp,
} from "../Account";
import {AccessTokenGenerator} from "../../AccessToken";
import {Context} from "../../Context";
import {ContextTest} from "../../ContextTest";
import {sql} from "../../pg/SQL";
import uuidV4 from "uuid/v4";

// NOTE: Run our tests concurrently for a nice speed boost.
const test: jest.It = (global as any).test.concurrent;

const testName = "Test";
const testEmail = "test@example.com";

describe("signUp", () => {
  test("rejects empty display names", () => {
    return Context.withUnauthorized(async ctx => {
      let error: any;
      try {
        await signUp(ctx, {name: "", email: testEmail, password: "qwerty"});
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(APIErrorCode.BAD_INPUT);
    });
  });

  test("rejects single character display names", () => {
    return Context.withUnauthorized(async ctx => {
      let error: any;
      try {
        await signUp(ctx, {name: "a", email: testEmail, password: "qwerty"});
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(APIErrorCode.BAD_INPUT);
    });
  });

  test("rejects empty emails", () => {
    return Context.withUnauthorized(async ctx => {
      let error: any;
      try {
        await signUp(ctx, {name: testName, email: "", password: "qwerty"});
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(APIErrorCode.BAD_INPUT);
    });
  });

  test("creates a new account", () => {
    return Context.withUnauthorized(async ctx => {
      await signUp(ctx, {name: testName, email: testEmail, password: "qwerty"});

      const {rowCount} = await ctx.query(
        sql`SELECT 1 FROM account WHERE email = ${testEmail}`,
      );

      expect(rowCount).toEqual(1);
    });
  });

  test("errors when trying to sign up with an already used email", () => {
    return Context.withUnauthorized(async ctx => {
      await signUp(ctx, {
        name: testName,
        email: testEmail,
        password: "qwerty1",
      });
      let error: any;
      try {
        await signUp(ctx, {
          name: testName,
          email: testEmail,
          password: "qwerty2",
        });
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED);
    });
  });

  test("creates a new refresh token", () => {
    return Context.withUnauthorized(async ctx => {
      const {accountID, refreshToken} = await signUp(ctx, {
        name: testName,
        email: testEmail,
        password: "qwerty",
      });

      const {rowCount} = await ctx.query(
        sql`SELECT 1 FROM refresh_token WHERE token = ${refreshToken} AND account_id = ${accountID}`,
      );
      expect(rowCount).toBe(1);
    });
  });

  test("creates a new access token", () => {
    return Context.withUnauthorized(async ctx => {
      const {accountID, accessToken} = await signUp(ctx, {
        name: testName,
        email: testEmail,
        password: "qwerty",
      });

      expect(await AccessTokenGenerator.verify(accessToken)).toEqual({
        exp: expect.any(Number),
        iat: expect.any(Number),
        id: accountID,
      });
    });
  });
});

describe("signIn", () => {
  test("fails if the account does not exist", () => {
    return Context.withUnauthorized(async ctx => {
      let error: any;
      try {
        await signIn(ctx, {email: testEmail, password: "qwerty"});
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(APIErrorCode.SIGN_IN_UNRECOGNIZED_EMAIL);
    });
  });

  test("fails if the wrong password is used", () => {
    return Context.withUnauthorized(async ctx => {
      await signUp(ctx, {name: testName, email: testEmail, password: "qwerty"});

      let error: any;
      try {
        await signIn(ctx, {email: testEmail, password: "qwerty1"});
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(APIErrorCode.SIGN_IN_INCORRECT_PASSWORD);
    });
  });

  test("creates a new refresh token", () => {
    return Context.withUnauthorized(async ctx => {
      await signUp(ctx, {name: testName, email: testEmail, password: "qwerty"});

      const {accountID, refreshToken} = await signIn(ctx, {
        email: testEmail,
        password: "qwerty",
      });

      const {rowCount} = await ctx.query(
        sql`SELECT 1 FROM refresh_token WHERE token = ${refreshToken} AND account_id = ${accountID}`,
      );
      expect(rowCount).toBe(1);
    });
  });

  test("creates a new access token", () => {
    return Context.withUnauthorized(async ctx => {
      await signUp(ctx, {name: testName, email: testEmail, password: "qwerty"});

      const {accountID, accessToken} = await signIn(ctx, {
        email: testEmail,
        password: "qwerty",
      });

      expect(await AccessTokenGenerator.verify(accessToken)).toEqual({
        exp: expect.any(Number),
        iat: expect.any(Number),
        id: accountID,
      });
    });
  });
});

describe("signOut", () => {
  test("noop if the token does not exist", () => {
    return Context.withUnauthorized(async ctx => {
      await signOut(ctx, {refreshToken: uuidV4() as any});
    });
  });

  test("prevents a refresh token from being used again", () => {
    return Context.withUnauthorized(async ctx => {
      const {refreshToken} = await signUp(ctx, {
        name: testName,
        email: testEmail,
        password: "qwerty",
      });

      await refreshAccessToken(ctx, {refreshToken});
      await signOut(ctx, {refreshToken});
      let error: any;
      try {
        await refreshAccessToken(ctx, {refreshToken});
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(APIErrorCode.REFRESH_TOKEN_INVALID);
    });
  });
});

describe("refreshAccessToken", () => {
  test("fails if the refresh token does not exist", () => {
    return Context.withUnauthorized(async ctx => {
      let error: any;
      try {
        await refreshAccessToken(ctx, {refreshToken: uuidV4() as RefreshToken});
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(APIErrorCode.REFRESH_TOKEN_INVALID);
    });
  });

  test("creates a new access token when given a refresh token", () => {
    return Context.withUnauthorized(async ctx => {
      const {accountID, refreshToken} = await signUp(ctx, {
        name: testName,
        email: testEmail,
        password: "qwerty",
      });

      const {accessToken} = await refreshAccessToken(ctx, {refreshToken});

      expect(await AccessTokenGenerator.verify(accessToken)).toEqual({
        exp: expect.any(Number),
        iat: expect.any(Number),
        id: accountID,
      });
    });
  });
});

describe("getCurrentProfile", () => {
  test("returns null if the account does not exist", () => {
    return Context.withAuthorized(42 as any, async ctx => {
      const {account} = await getCurrentProfile(ctx);

      expect(account).toEqual(null);
    });
  });

  test("gets the account profile if one exists", () => {
    return ContextTest.with(async ctx => {
      const {accountID} = await ctx.withUnauthorized(ctx => {
        return signUp(ctx, {
          name: testName,
          email: testEmail,
          password: "",
        });
      });

      const {account} = await ctx.withAuthorized(accountID, ctx => {
        return getCurrentProfile(ctx);
      });

      expect(account).toEqual({
        id: accountID,
        name: testName,
        avatarURL: null,
      });
    });
  });
});

describe("getCurrentGroupMemberships", () => {
  test("returns an empty array if the account does not exist", () => {
    return ContextTest.with(async ctx => {
      await ctx.withAuthorized(generateID(), async ctx => {
        expect(await getCurrentGroupMemberships(ctx)).toEqual({groups: []});
      });
    });
  });

  test("returns an empty array if the account is not a member of any groups", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getCurrentGroupMemberships(ctx)).toEqual({groups: []});
      });
    });
  });

  test("returns the group an account is a member of", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group = await createGroup(ctx);

      await createGroupMember(ctx, {accountID: account.id, groupID: group.id});

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getCurrentGroupMemberships(ctx)).toEqual({
          groups: [group],
        });
      });
    });
  });

  test("returns the groups an account is a member of", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group1 = await createGroup(ctx);
      const group2 = await createGroup(ctx);
      const group3 = await createGroup(ctx);

      await createGroupMember(ctx, {accountID: account.id, groupID: group1.id});
      await createGroupMember(ctx, {accountID: account.id, groupID: group2.id});
      await createGroupMember(ctx, {accountID: account.id, groupID: group3.id});

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getCurrentGroupMemberships(ctx)).toEqual({
          groups: [group1, group2, group3],
        });
      });
    });
  });

  test("will not return the groups an account is not a member of", () => {
    return ContextTest.with(async ctx => {
      const account = await createAccount(ctx);
      const group1 = await createGroup(ctx);
      await createGroup(ctx);
      const group3 = await createGroup(ctx);

      await createGroupMember(ctx, {accountID: account.id, groupID: group1.id});
      await createGroupMember(ctx, {accountID: account.id, groupID: group3.id});

      await ctx.withAuthorized(account.id, async ctx => {
        expect(await getCurrentGroupMemberships(ctx)).toEqual({
          groups: [group1, group3],
        });
      });
    });
  });
});

describe("getProfile", () => {
  test("cannot get a profile that does not exist", () => {
    return ContextTest.with(async ctx => {
      const {accountID} = await ctx.withUnauthorized(ctx => {
        return signUp(ctx, {
          name: testName,
          email: testEmail,
          password: "",
        });
      });

      await ctx.withAuthorized(accountID, async ctx => {
        expect(await getProfile(ctx, {id: -42 as any})).toEqual({
          account: null,
        });
      });
    });
  });

  test("can get any profile", () => {
    return ContextTest.with(async ctx => {
      const accountIDs = await ctx.withUnauthorized(async ctx => {
        return [
          await signUp(ctx, {
            name: "Test 0",
            email: "test0@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 1",
            email: "test1@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 2",
            email: "test2@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 3",
            email: "test3@example.com",
            password: "",
          }),
        ].map(({accountID}) => accountID);
      });

      await ctx.withAuthorized(accountIDs[0], async ctx => {
        expect(await getProfile(ctx, {id: accountIDs[1]})).toEqual({
          account: {
            id: accountIDs[1],
            name: "Test 1",
            avatarURL: null,
          },
        });
        expect(await getProfile(ctx, {id: accountIDs[2]})).toEqual({
          account: {
            id: accountIDs[2],
            name: "Test 2",
            avatarURL: null,
          },
        });
        expect(await getProfile(ctx, {id: accountIDs[3]})).toEqual({
          account: {
            id: accountIDs[3],
            name: "Test 3",
            avatarURL: null,
          },
        });
      });
    });
  });
});

describe("getManyProfiles", () => {
  test("can get no profiles", () => {
    return ContextTest.with(async ctx => {
      const {accountID} = await ctx.withUnauthorized(ctx => {
        return signUp(ctx, {
          name: testName,
          email: testEmail,
          password: "",
        });
      });

      await ctx.withAuthorized(accountID, async ctx => {
        expect(await getManyProfiles(ctx, {ids: []})).toEqual({accounts: []});
      });
    });
  });

  test("can get one profile", () => {
    return ContextTest.with(async ctx => {
      const accountIDs = await ctx.withUnauthorized(async ctx => {
        return [
          await signUp(ctx, {
            name: "Test 0",
            email: "test0@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 1",
            email: "test1@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 2",
            email: "test2@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 3",
            email: "test3@example.com",
            password: "",
          }),
        ].map(({accountID}) => accountID);
      });

      await ctx.withAuthorized(accountIDs[0], async ctx => {
        expect(await getManyProfiles(ctx, {ids: [accountIDs[2]]})).toEqual({
          accounts: [
            {
              id: accountIDs[2],
              name: "Test 2",
              avatarURL: null,
            },
          ],
        });
      });
    });
  });

  test("can get any profiles", () => {
    return ContextTest.with(async ctx => {
      const accountIDs = await ctx.withUnauthorized(async ctx => {
        return [
          await signUp(ctx, {
            name: "Test 0",
            email: "test0@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 1",
            email: "test1@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 2",
            email: "test2@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 3",
            email: "test3@example.com",
            password: "",
          }),
        ].map(({accountID}) => accountID);
      });

      await ctx.withAuthorized(accountIDs[0], async ctx => {
        expect(
          await getManyProfiles(ctx, {
            ids: [accountIDs[1], accountIDs[2], accountIDs[3]],
          }),
        ).toEqual({
          accounts: [
            {
              id: accountIDs[1],
              name: "Test 1",
              avatarURL: null,
            },
            {
              id: accountIDs[2],
              name: "Test 2",
              avatarURL: null,
            },
            {
              id: accountIDs[3],
              name: "Test 3",
              avatarURL: null,
            },
          ],
        });
      });
    });
  });

  test("cannot get a profile that does not exist", () => {
    return ContextTest.with(async ctx => {
      const accountIDs = await ctx.withUnauthorized(async ctx => {
        return [
          await signUp(ctx, {
            name: "Test 0",
            email: "test0@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 1",
            email: "test1@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 2",
            email: "test2@example.com",
            password: "",
          }),
          await signUp(ctx, {
            name: "Test 3",
            email: "test3@example.com",
            password: "",
          }),
        ].map(({accountID}) => accountID);
      });

      await ctx.withAuthorized(accountIDs[0], async ctx => {
        expect(
          await getManyProfiles(ctx, {
            ids: [accountIDs[1], accountIDs[2], generateID(), accountIDs[3]],
          }),
        ).toEqual({
          accounts: [
            {
              id: accountIDs[1],
              name: "Test 1",
              avatarURL: null,
            },
            {
              id: accountIDs[2],
              name: "Test 2",
              avatarURL: null,
            },
            {
              id: accountIDs[3],
              name: "Test 3",
              avatarURL: null,
            },
          ],
        });
      });
    });
  });
});
