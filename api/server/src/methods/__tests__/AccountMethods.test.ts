import {APIError, APIErrorCode, RefreshToken} from "@connect/api-client";
import {
  getCurrentProfile,
  refreshAccessToken,
  signIn,
  signOut,
  signUp,
} from "../AccountMethods";
import uuidV4 from "uuid/v4";
import {Context, ContextUnauthorized} from "../../Context";
import {sql} from "../../PGSQL";
import {AccessTokenGenerator} from "../../AccessToken";

const testName = "Test";
const testEmail = "test@example.com";

describe("signUp", () => {
  test("rejects empty display names", () => {
    return ContextUnauthorized.withUnauthorized(async ctx => {
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
    return ContextUnauthorized.withUnauthorized(async ctx => {
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
    return ContextUnauthorized.withUnauthorized(async ctx => {
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
    return ContextUnauthorized.withUnauthorized(async ctx => {
      await signUp(ctx, {name: testName, email: testEmail, password: "qwerty"});

      const {rowCount} = await ctx.query(
        sql`SELECT 1 FROM account WHERE email = ${testEmail}`,
      );

      expect(rowCount).toEqual(1);
    });
  });

  test("errors when trying to sign up with an already used email", () => {
    return ContextUnauthorized.withUnauthorized(async ctx => {
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
    return ContextUnauthorized.withUnauthorized(async ctx => {
      const {refreshToken} = await signUp(ctx, {
        name: testName,
        email: testEmail,
        password: "qwerty",
      });

      const {
        rows: [{id: accountID}],
      } = await ctx.query(
        sql`SELECT id FROM account WHERE email = ${testEmail}`,
      );
      const {rowCount} = await ctx.query(
        sql`SELECT 1 FROM refresh_token WHERE token = ${refreshToken} AND account_id = ${accountID}`,
      );
      expect(rowCount).toBe(1);
    });
  });

  test("creates a new access token", () => {
    return ContextUnauthorized.withUnauthorized(async ctx => {
      const {accessToken} = await signUp(ctx, {
        name: testName,
        email: testEmail,
        password: "qwerty",
      });

      const {
        rows: [{id: accountID}],
      } = await ctx.query(
        sql`SELECT id FROM account WHERE email = ${testEmail}`,
      );
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
    return ContextUnauthorized.withUnauthorized(async ctx => {
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
    return ContextUnauthorized.withUnauthorized(async ctx => {
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
    return ContextUnauthorized.withUnauthorized(async ctx => {
      await signUp(ctx, {name: testName, email: testEmail, password: "qwerty"});

      const {refreshToken} = await signIn(ctx, {
        email: testEmail,
        password: "qwerty",
      });

      const {
        rows: [{id: accountID}],
      } = await ctx.query(
        sql`SELECT id FROM account WHERE email = ${testEmail}`,
      );
      const {rowCount} = await ctx.query(
        sql`SELECT 1 FROM refresh_token WHERE token = ${refreshToken} AND account_id = ${accountID}`,
      );
      expect(rowCount).toBe(1);
    });
  });

  test("creates a new access token", () => {
    return ContextUnauthorized.withUnauthorized(async ctx => {
      await signUp(ctx, {name: testName, email: testEmail, password: "qwerty"});

      const {accessToken} = await signIn(ctx, {
        email: testEmail,
        password: "qwerty",
      });

      const {
        rows: [{id: accountID}],
      } = await ctx.query(
        sql`SELECT id FROM account WHERE email = ${testEmail}`,
      );
      expect(await AccessTokenGenerator.verify(accessToken)).toEqual({
        exp: expect.any(Number),
        iat: expect.any(Number),
        id: accountID,
      });
    });
  });
});

// describe("signOut", () => {
//   test("noop if the token does not exist", async () => {
//     const refreshTokens = new MockRefreshTokenCollection();

//     await signOut({refreshTokens}, {refreshToken: "yolo" as any});
//   });

//   test("prevents a refresh token from being used again", async () => {
//     const accounts = new MockAccountCollection();
//     const refreshTokens = new MockRefreshTokenCollection();
//     const {refreshToken} = await signUp(
//       {accounts, refreshTokens},
//       {name: testName, email: testEmail, password: "qwerty"},
//     );

//     await refreshAccessToken({refreshTokens}, {refreshToken});
//     await signOut({refreshTokens}, {refreshToken});
//     let error: any;
//     try {
//       await refreshAccessToken({refreshTokens}, {refreshToken});
//     } catch (e) {
//       error = e;
//     }

//     expect(error).toBeInstanceOf(APIError);
//     expect(error.code).toBe(APIErrorCode.REFRESH_TOKEN_INVALID);
//   });
// });

// describe("refreshAccessToken", () => {
//   test("fails if the refresh token does not exist", async () => {
//     const refreshTokens = new MockRefreshTokenCollection();

//     let error: any;
//     try {
//       await refreshAccessToken(
//         {refreshTokens},
//         {refreshToken: uuidV4() as RefreshToken},
//       );
//     } catch (e) {
//       error = e;
//     }

//     expect(error).toBeInstanceOf(APIError);
//     expect(error.code).toBe(APIErrorCode.REFRESH_TOKEN_INVALID);
//   });

//   test("creates a new access token when given a refresh token", async () => {
//     const accounts = new MockAccountCollection();
//     const refreshTokens = new MockRefreshTokenCollection();
//     const {refreshToken} = await signUp(
//       {accounts, refreshTokens},
//       {name: testName, email: testEmail, password: "qwerty"},
//     );

//     const {accessToken} = await refreshAccessToken(
//       {refreshTokens},
//       {refreshToken},
//     );

//     const accountID = (await accounts.getAuth(testEmail))!.id;
//     expect(await AccessTokenGenerator.verify(accessToken)).toEqual({
//       exp: expect.any(Number),
//       iat: expect.any(Number),
//       id: accountID,
//     });
//   });
// });

// describe("getCurrentProfile", () => {
//   test("throws if the account does not exist", async () => {
//     const accounts = new MockAccountCollection();

//     let error: any;
//     try {
//       await getCurrentProfile({accounts}, 42 as any);
//     } catch (e) {
//       error = e;
//     }

//     expect(error).toBeInstanceOf(APIError);
//     expect(error.code).toBe(APIErrorCode.NOT_FOUND);
//   });

//   test("gets the account profile if one exists", async () => {
//     const accounts = new MockAccountCollection();
//     const accountID = await accounts.register({
//       name: testName,
//       email: testEmail,
//       passwordHash: "",
//     });

//     const {account} = await getCurrentProfile({accounts}, accountID!);

//     expect(account).toEqual({
//       id: accountID,
//       name: testName,
//       avatarURL: null,
//     });
//   });
// });
