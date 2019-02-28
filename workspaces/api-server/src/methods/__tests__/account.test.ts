import {APIError, APIErrorCode} from "@connect/api-client";
import {Database, withDatabase} from "../../Database";
import {signUp} from "../account";

const testEmail = "test@example.com";

async function testWithDatabase(
  action: (database: Database) => Promise<void>,
): Promise<void> {
  await withDatabase(async database => {
    await database.query("BEGIN");
    await action(database);
    await database.query("ROLLBACK");
  });
}

describe("signUp", () => {
  test("creates a new account", async () => {
    await testWithDatabase(async database => {
      const result1 = await database.query(
        "SELECT 1 FROM account WHERE email = $1",
        [testEmail],
      );
      expect(result1.rowCount).toBe(0);
      await signUp(database, {email: testEmail, password: "qwerty"});
      const result2 = await database.query(
        "SELECT 1 FROM account WHERE email = $1",
        [testEmail],
      );
      expect(result2.rowCount).toBe(1);
    });
  });

  test("errors when trying to sign up with an already used email", async () => {
    await testWithDatabase(async database => {
      await signUp(database, {email: testEmail, password: "qwerty1"});
      let error: any;
      try {
        await signUp(database, {email: testEmail, password: "qwerty2"});
      } catch (e) {
        error = e;
      }
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBe(APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED);
    });
  });

  test("creates a new refresh token", async () => {
    await testWithDatabase(async database => {
      const {refreshToken} = await signUp(database, {
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
  });
});
