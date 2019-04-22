/**
 * Initializes a temporary, small, Postgres database we will use during testing.
 * The database configured is to start very quickly.
 *
 * When unit testing, it is advised that you mock out components not under test.
 * Usually, people include Postgres.
 *
 * However, there are some components to your program which are so critical that
 * mocking them out means there’s very little to test at all. For example, it
 * would be ridiculous to mock your programming language or standard library.
 * For this reason we _don’t_ mock Postgres. It’s such a critical piece of our
 * program that mocking it means we wouldn’t have much to test.
 *
 * We want to test all the SQL queries we’ve written as they make up a
 * significant portion of our program’s logic.
 */

const path = require("path");
const os = require("os");
const fs = require("fs-extra");
const cp = require("child_process");
const debug = require("debug")("connect:test:pg");
const getPort = require("get-port");
const {Client} = require("pg");
const migrate = require("@connect/db/scripts/migrate");

const osTempDir = os.tmpdir();
const tempDirPrefix = "connect-test-postgres-";

async function initializeFreshDatabase() {
  // Create a new temporary directory.
  const tempDir = await fs.mkdtemp(path.join(osTempDir, tempDirPrefix));
  const dataDir = path.join(tempDir, "data");

  // Initialize a Postgres database. This usually takes about two seconds. Yeah
  // that’s pretty expensive.
  await new Promise((resolve, reject) => {
    cp.exec(
      `initdb --encoding=UNICODE --auth=trust --pgdata=${dataDir}`,
      error => {
        if (error) reject(error);
        else resolve();
      },
    );
  });

  // Write a Postgres configuration. The configuration is optimized for a super
  // light instance that can spin up quickly. Configuration taken
  // from [`pg_tmp`][1].
  //
  // [1]: http://eradman.com/ephemeralpg
  await fs.writeFile(
    path.join(dataDir, "postgresql.conf"),
    [
      `unix_socket_directories = '${tempDir}'`,
      "listen_addresses = ''",
      "shared_buffers = 12MB",
      "fsync = off",
      "synchronous_commit = off",
      "full_page_writes = off",
      "log_connections = on",
      "log_disconnections = on",
    ].join("\n") + "\n",
  );

  // Add a file which marks this directory as freshly created.
  await fs.writeFile(path.join(tempDir, "FRESH"), "");

  return tempDir;
}

module.exports = async () => {
  // Search for a temporary database folder that was already initialized.
  debug("Searching for existing fresh database");
  let tempDir;
  const directoryNames = await fs.readdir(osTempDir);
  for (let i = 0; i < directoryNames.length; i++) {
    const directoryName = directoryNames[i];
    if (!directoryName.startsWith(tempDirPrefix)) continue;
    try {
      const stats = await fs.stat(path.join(osTempDir, directoryName, "FRESH"));
      if (stats.isFile()) {
        tempDir = path.join(osTempDir, directoryName);
        break;
      }
    } catch (error) {
      // noop
    }
  }

  // If we could not find an existing fresh database then we must create a new
  // one ourselves.
  if (tempDir === undefined) {
    debug("Could not find existing fresh database, initializing a new one");
    tempDir = await initializeFreshDatabase();
  } else {
    debug("Found existing fresh database");
  }

  // Remove the file tagging the directory as fresh.
  await fs.remove(path.join(tempDir, "FRESH"));

  // Notably we don’t await this call! We don’t care about the result. Ignore
  // any errors.
  debug("Optimistically initializing a database for the next run");
  initializeFreshDatabase().catch(() => {});

  // Log which directory we will be using.
  debug(`Using the directory ${tempDir}`);
  const dataDir = path.join(tempDir, "data");

  debug("Finding an available port");
  const port = await getPort();

  // Set Postgres environment variables.
  process.env.PGHOST = tempDir;
  process.env.PGPORT = port;
  process.env.PGDATABASE = "test";
  delete process.env.PGUSER;

  debug(`Starting Postgres on port ${port}`);
  const subprocess = cp.exec(`postgres -D ${dataDir} -p ${port}`);

  // Pipe the Postgres process log to a file for later inspection.
  subprocess.stderr.pipe(
    fs.createWriteStream(path.join(tempDir, "postgres.log")),
  );

  // Wait for the database to start up. Retry 5 times waiting 100ms between
  // each attempt.
  let error;
  for (let i = 0; i <= 5; i++) {
    error = undefined;
    debug(`Creating test database${i !== 0 ? ` (retry ${i})` : ""}`);
    await new Promise(resolve => setTimeout(resolve, 100));
    try {
      await new Promise((resolve, reject) => {
        cp.exec(`createdb test`, error => {
          if (error) reject(error);
          else resolve();
        });
      });
      break;
    } catch (e) {
      error = e;
    }
  }

  // If our loop ended with an error then throw it.
  if (error !== undefined) {
    throw error;
  }

  debug("Creating test user");
  const client = new Client();
  try {
    await client.connect();
    await client.query("CREATE ROLE connect_api_test LOGIN SUPERUSER");
    process.env.PGUSER = "connect_api_test"; // Run migrations as our test user.
  } finally {
    client.end();
  }

  debug("Running migrations");
  await migrate({silent: true});

  // Set a global which our teardown script can access to kill our
  // temporary database.
  global.__PG_TEST__ = {
    tempDir,
    subprocess,
  };
};

// If we run this JavaScript file as a script, then run both setup and teardown
// for testing purposes.
if (!module.parent) {
  require("debug").enable("connect:test:pg");
  module
    .exports()
    .then(() => require("./jest-global-teardown")())
    .catch(error =>
      setImmediate(() => {
        throw error;
      }),
    );
}
