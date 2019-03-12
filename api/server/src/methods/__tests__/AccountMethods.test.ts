import {APIError, APIErrorCode} from "@connect/api-client";
import {
  MockRefreshTokenCollection,
  RefreshToken,
} from "../../entities/RefreshToken";
import {refreshAccessToken, signIn, signUp} from "../AccountMethods";
import {AccessTokenGenerator} from "../../entities/AccessToken";
import {MockAccountCollection} from "../../entities/Account";
import uuidV4 from "uuid/v4";

const testName = "Test";
const testEmail = "test@example.com";

describe("signUp", () => {
  test("rejects empty display names", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();

    let error: any;
    try {
      await signUp(
        {accounts, refreshTokens},
        {name: "", email: testEmail, password: "qwerty"},
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.BAD_INPUT);
  });

  test("rejects single character display names", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();

    let error: any;
    try {
      await signUp(
        {accounts, refreshTokens},
        {name: "a", email: testEmail, password: "qwerty"},
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.BAD_INPUT);
  });

  test("rejects empty emails", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();

    let error: any;
    try {
      await signUp(
        {accounts, refreshTokens},
        {name: testName, email: "", password: "qwerty"},
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.BAD_INPUT);
  });

  test("creates a new account", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();

    await signUp(
      {accounts, refreshTokens},
      {name: testName, email: testEmail, password: "qwerty"},
    );

    expect(accounts.getAuth(testEmail)).toBeTruthy();
  });

  test("errors when trying to sign up with an already used email", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();

    await signUp(
      {accounts, refreshTokens},
      {name: testName, email: testEmail, password: "qwerty1"},
    );
    let error: any;
    try {
      await signUp(
        {accounts, refreshTokens},
        {name: testName, email: testEmail, password: "qwerty2"},
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED);
  });

  test("creates a new refresh token", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();

    const {refreshToken} = await signUp(
      {accounts, refreshTokens},
      {name: testName, email: testEmail, password: "qwerty"},
    );

    const accountID = (await accounts.getAuth(testEmail))!.id;
    expect(await refreshTokens.use(refreshToken)).toBe(accountID);
  });

  test("creates a new access token", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();

    const {accessToken} = await signUp(
      {accounts, refreshTokens},
      {name: testName, email: testEmail, password: "qwerty"},
    );

    const accountID = (await accounts.getAuth(testEmail))!.id;
    expect(await AccessTokenGenerator.verify(accessToken)).toEqual({
      exp: expect.any(Number),
      iat: expect.any(Number),
      id: accountID,
    });
  });
});

describe("signIn", () => {
  test("fails if the account does not exist", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();

    let error: any;
    try {
      await signIn(
        {accounts, refreshTokens},
        {email: testEmail, password: "qwerty"},
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.SIGN_IN_UNRECOGNIZED_EMAIL);
  });

  test("fails if the wrong password is used", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();
    await signUp(
      {accounts, refreshTokens},
      {name: testName, email: testEmail, password: "qwerty"},
    );

    let error: any;
    try {
      await signIn(
        {accounts, refreshTokens},
        {email: testEmail, password: "qwerty1"},
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.SIGN_IN_INCORRECT_PASSWORD);
  });

  test("creates a new refresh token", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();
    await signUp(
      {accounts, refreshTokens},
      {name: testName, email: testEmail, password: "qwerty"},
    );

    const {refreshToken} = await signIn(
      {accounts, refreshTokens},
      {email: testEmail, password: "qwerty"},
    );

    const accountID = (await accounts.getAuth(testEmail))!.id;
    expect(await refreshTokens.use(refreshToken)).toBe(accountID);
  });

  test("creates a new access token", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();
    await signUp(
      {accounts, refreshTokens},
      {name: testName, email: testEmail, password: "qwerty"},
    );

    const {accessToken} = await signIn(
      {accounts, refreshTokens},
      {email: testEmail, password: "qwerty"},
    );

    const accountID = (await accounts.getAuth(testEmail))!.id;
    expect(await AccessTokenGenerator.verify(accessToken)).toEqual({
      exp: expect.any(Number),
      iat: expect.any(Number),
      id: accountID,
    });
  });
});

describe("refreshAccessToken", () => {
  test("fails if the refresh token does not exist", async () => {
    const refreshTokens = new MockRefreshTokenCollection();

    let error: any;
    try {
      await refreshAccessToken(
        {refreshTokens},
        {refreshToken: uuidV4() as RefreshToken},
      );
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.REFRESH_TOKEN_INVALID);
  });

  test("creates a new access token when given a refresh token", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();
    const {refreshToken} = await signUp(
      {accounts, refreshTokens},
      {name: testName, email: testEmail, password: "qwerty"},
    );

    const {accessToken} = await refreshAccessToken(
      {refreshTokens},
      {refreshToken},
    );

    const accountID = (await accounts.getAuth(testEmail))!.id;
    expect(await AccessTokenGenerator.verify(accessToken)).toEqual({
      exp: expect.any(Number),
      iat: expect.any(Number),
      id: accountID,
    });
  });
});
