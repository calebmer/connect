import uuidV4 from "uuid/v4";
import jwt from "jsonwebtoken";
import {APIError, APIErrorCode} from "@connect/api-client";
import {withTestDatabase} from "../../Database";
import {JWT_SECRET, signUp, signIn, refreshAccessToken} from "../Account";

const testDisplayName = "Test";
const testEmail = "test@example.com";

const database = withTestDatabase();

describe("signUp", () => {
  test("creates a new account", async () => {
    const result1 = await database.query(
      "SELECT 1 FROM account WHERE email = $1",
      [testEmail],
    );
    expect(result1.rowCount).toBe(0);
    await signUp(database, {
      displayName: testDisplayName,
      email: testEmail,
      password: "qwerty",
    });
    const result2 = await database.query(
      "SELECT 1 FROM account WHERE email = $1",
      [testEmail],
    );
    expect(result2.rowCount).toBe(1);
  });

  test("errors when trying to sign up with an already used email", async () => {
    await signUp(database, {
      displayName: testDisplayName,
      email: testEmail,
      password: "qwerty1",
    });
    let error: any;
    try {
      await signUp(database, {
        displayName: testDisplayName,
        email: testEmail,
        password: "qwerty2",
      });
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED);
  });

  test("creates a new refresh token", async () => {
    const {refreshToken} = await signUp(database, {
      displayName: testDisplayName,
      email: testEmail,
      password: "qwerty",
    });
    const result1 = await database.query(
      "SELECT id FROM account WHERE email = $1",
      [testEmail],
    );
    expect(result1.rowCount).toBe(1);
    const accountID = result1.rows[0].id;
    const result2 = await database.query(
      "SELECT account_id FROM refresh_token WHERE token = $1",
      [refreshToken],
    );
    expect(result2.rowCount).toBe(1);
    expect(result2.rows[0].account_id).toBe(accountID);
  });

  test("creates a new access token", async () => {
    const {accessToken} = await signUp(database, {
      displayName: testDisplayName,
      email: testEmail,
      password: "qwerty",
    });
    const result = await database.query(
      "SELECT id FROM account WHERE email = $1",
      [testEmail],
    );
    expect(result.rowCount).toBe(1);
    const accountID = result.rows[0].id;
    const payload: any = await new Promise<any>((resolve, reject) => {
      jwt.verify(accessToken, JWT_SECRET, (error, payload) => {
        if (error) reject(error);
        else resolve(payload);
      });
    });
    expect(payload.id).toBe(accountID);
  });
});

describe("signIn", () => {
  test("fails if the account does not exist", async () => {
    let error: any;
    try {
      await signIn(database, {email: testEmail, password: "qwerty"});
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.SIGN_IN_UNRECOGNIZED_EMAIL);
  });

  test("fails if the wrong password is used", async () => {
    let error: any;
    await signUp(database, {
      displayName: testDisplayName,
      email: testEmail,
      password: "qwerty",
    });
    try {
      await signIn(database, {email: testEmail, password: "qwerty1"});
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.SIGN_IN_INCORRECT_PASSWORD);
  });

  test("creates a new refresh token", async () => {
    await signUp(database, {
      displayName: testDisplayName,
      email: testEmail,
      password: "qwerty",
    });
    const {refreshToken} = await signIn(database, {
      email: testEmail,
      password: "qwerty",
    });
    const result1 = await database.query(
      "SELECT id FROM account WHERE email = $1",
      [testEmail],
    );
    expect(result1.rowCount).toBe(1);
    const accountID = result1.rows[0].id;
    const result2 = await database.query(
      "SELECT account_id FROM refresh_token WHERE token = $1",
      [refreshToken],
    );
    expect(result2.rowCount).toBe(1);
    expect(result2.rows[0].account_id).toBe(accountID);
  });

  test("creates a new access token", async () => {
    await signUp(database, {
      displayName: testDisplayName,
      email: testEmail,
      password: "qwerty",
    });
    const {accessToken} = await signIn(database, {
      email: testEmail,
      password: "qwerty",
    });
    const result = await database.query(
      "SELECT id FROM account WHERE email = $1",
      [testEmail],
    );
    expect(result.rowCount).toBe(1);
    const accountID = result.rows[0].id;
    const payload: any = await new Promise<any>((resolve, reject) => {
      jwt.verify(accessToken, JWT_SECRET, (error, payload) => {
        if (error) reject(error);
        else resolve(payload);
      });
    });
    expect(payload.id).toBe(accountID);
  });
});

describe("refreshAccessToken", () => {
  test("fails if the refresh token does not exist", async () => {
    let error: any;
    try {
      await refreshAccessToken(database, {refreshToken: uuidV4()});
    } catch (e) {
      error = e;
    }
    expect(error).toBeInstanceOf(APIError);
    expect(error.code).toBe(APIErrorCode.REFRESH_TOKEN_INVALID);
  });

  test("creates a new access token when given a refresh token", async () => {
    const {refreshToken} = await signUp(database, {
      displayName: testDisplayName,
      email: testEmail,
      password: "qwerty",
    });
    const {accessToken} = await refreshAccessToken(database, {refreshToken});
    const result = await database.query(
      "SELECT id FROM account WHERE email = $1",
      [testEmail],
    );
    expect(result.rowCount).toBe(1);
    const accountID = result.rows[0].id;
    const payload: any = await new Promise<any>((resolve, reject) => {
      jwt.verify(accessToken, JWT_SECRET, (error, payload) => {
        if (error) reject(error);
        else resolve(payload);
      });
    });
    expect(payload.id).toBe(accountID);
  });
});
