import {APIError, APIErrorCode, RefreshToken} from "@connect/api-client";
import {
  getCurrentProfile,
  refreshAccessToken,
  signIn,
  signOut,
  signUp,
} from "../AccountMethods";
import {AccessTokenGenerator} from "../../AccessToken";
import {Context} from "../../Context";
import {ContextTest} from "../../ContextTest";
import {sql} from "../../PGSQL";
import uuidV4 from "uuid/v4";

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
  test("throws if the account does not exist", () => {
    return Context.withAuthorized(42 as any, async ctx => {
      let error: any;
      try {
        await getCurrentProfile(ctx);
      } catch (e) {
        error = e;
      }

      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(APIErrorCode.NOT_FOUND);
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
