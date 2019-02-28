import {APIError, APIErrorCode} from "@connect/api-client";
import {Database, withDatabase} from "../../Database";
import {signUp} from "../account";

const testEmail = "test@example.com";

let resolveDatabase: (database: Database) => void;
let resolveReleaseDatabase: (releaseDatabase: () => void) => void;

const databasePromise = new Promise<Database>(r => (resolveDatabase = r));
const releaseDatabasePromise = new Promise<() => void>(
  r => (resolveReleaseDatabase = r),
);

beforeAll(() => {
  withDatabase(database => {
    resolveDatabase(database);
    return new Promise(resolve => {
      resolveReleaseDatabase(resolve);
    });
  });
});

afterAll(async () => {
  const releaseDatabase = await releaseDatabasePromise;
  releaseDatabase();
});

beforeEach(async () => {
  const database = await databasePromise;
  await database.query("BEGIN");
});

afterEach(async () => {
  const database = await databasePromise;
  await database.query("ROLLBACK");
});

describe("signUp", () => {
  test("creates a new account", async () => {
    const database = await databasePromise;
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

  test("errors when trying to sign up with an already used email", async () => {
    const database = await databasePromise;
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
