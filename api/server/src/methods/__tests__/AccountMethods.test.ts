import {APIError, APIErrorCode, RefreshToken} from "@connect/api-client";
import {
  AccessTokenGenerator,
  MockRefreshTokenCollection,
} from "../../entities/Tokens";
import {
  getCurrentProfile,
  refreshAccessToken,
  signIn,
  signOut,
  signUp,
} from "../AccountMethods";
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

describe("signOut", () => {
  test("noop if the token does not exist", async () => {
    const refreshTokens = new MockRefreshTokenCollection();

    await signOut({refreshTokens}, {refreshToken: "yolo" as any});
  });

  test("prevents a refresh token from being used again", async () => {
    const accounts = new MockAccountCollection();
    const refreshTokens = new MockRefreshTokenCollection();
    const {refreshToken} = await signUp(
      {accounts, refreshTokens},
      {name: testName, email: testEmail, password: "qwerty"},
    );

    await refreshAccessToken({refreshTokens}, {refreshToken});
    await signOut({refreshTokens}, {refreshToken});
    let error: any;
    try {
      await refreshAccessToken({refreshTokens}, {refreshToken});
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.REFRESH_TOKEN_INVALID);
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

describe("getCurrentProfile", () => {
  test("throws if the account does not exist", async () => {
    const accounts = new MockAccountCollection();

    let error: any;
    try {
      await getCurrentProfile({accounts}, 42 as any);
    } catch (e) {
      error = e;
    }

    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.NOT_FOUND);
  });

  test("gets the account profile if one exists", async () => {
    const accounts = new MockAccountCollection();
    const accountID = await accounts.register({
      name: testName,
      email: testEmail,
      passwordHash: "",
    });

    const {account} = await getCurrentProfile({accounts}, accountID!);

    expect(account).toEqual({
      id: accountID,
      name: testName,
      avatarURL: null,
    });
  });
});
