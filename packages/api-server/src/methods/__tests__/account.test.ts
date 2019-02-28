import {Database, withDatabase} from "../../Database";
import {signUp} from "../account";
import {APIError, APIErrorCode} from "@connect/api-client/build";

let resolveDatabase: (database: Database) => void;
let resolveReleaseDatabase: (releaseDatabase: () => void) => void;

const databasePromise = new Promise<Database>(r => (resolveDatabase = r));
const releaseDatabasePromise = new Promise<() => void>(
  r => (resolveReleaseDatabase = r),
);

beforeAll(() => {
  withDatabase(async database => {
    await database.query("BEGIN");
    resolveDatabase(database);
    return new Promise(resolve => {
      resolveReleaseDatabase(resolve);
    });
  });
});

afterAll(async () => {
  const database = await databasePromise;
  const releaseDatabase = await releaseDatabasePromise;
  await database.query("ROLLBACK");
  releaseDatabase();
});

describe("signUp", () => {
  test("errors when trying to sign up with an already used email", async () => {
    const database = await databasePromise;
    await signUp(database, {email: "hello@example.com", password: "qwerty1"});
    try {
      await signUp(database, {email: "hello@example.com", password: "qwerty2"});
      expect(true).toBe(false);
    } catch (error) {
      console.dir(error);
      expect(error).toBeInstanceOf(APIError);
      expect(error.code).toBeInstanceOf(
        APIErrorCode.SIGN_UP_EMAIL_ALREADY_USED,
      );
    }
  });
});
