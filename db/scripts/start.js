/* eslint-disable no-console */

const path = require("path");
const fs = require("fs-extra");
const cp = require("child_process");
const chalk = require("chalk");
const xdg = require("xdg-basedir");
const createClient = require("./lib/createClient");
const migrate = require("./migrate");

const connectDevDir = path.join(xdg.data, "connect-dev");
const dataDir = path.join(connectDevDir, "pg");
const logFile = path.join(connectDevDir, "postgres.log");

async function start() {
  // Should we initialize a fresh database during this run?
  let freshDatabase = false;

  try {
    // Check to see if a database already exists. If it does not then we need to
    // create one!
    if (!(await fs.exists(dataDir))) {
      console.log(
        `${chalk.grey("▸")} Initializing database in ${chalk.bold.underline(
          dataDir,
        )}`,
      );

      // Ensure the directory exists for the future...
      await fs.ensureDir(dataDir);

      // We are initializing a fresh database.
      freshDatabase = true;

      // Initialize a Postgres database. This usually takes about two seconds.
      await new Promise((resolve, reject) => {
        cp.exec(
          `initdb --encoding=UNICODE --auth=trust --pgdata=${dataDir}`,
          error => {
            if (error) reject(error);
            else resolve();
          },
        );
      });
    }

    try {
      // Use `pg_ctl` to get the current status of the Postgres server for our
      // data directory. If a Postgres server is not currently running then this
      // function will throw.
      await new Promise((resolve, reject) => {
        cp.exec(`pg_ctl status -D ${dataDir}`, error => {
          if (error) reject(error);
          else resolve();
        });
      });
    } catch (_error) {
      console.log(
        `${chalk.grey("▸")} Starting database on port ${chalk.bold.underline(
          createClient.PORT,
        )}`,
      );

      // If `pg_ctl status` failed then let’s start our Postgres database! Make
      // sure to set the log file so that we can debug our Postgres output.
      //
      // We use `cp.spawn()` so that killing our current process does not kill
      // the subprocess.
      //
      // NOTE: We intentionally don’t shut down the Postgres server after this
      // command finishes. We intend for the Postgres server we start to be
      // long living and manually shut down.
      await new Promise((resolve, reject) => {
        const subprocess = cp.spawn(
          "pg_ctl",
          [
            "start",
            "-D",
            dataDir,
            "-o",
            `"-p ${createClient.PORT}"`,
            "-l",
            logFile,
          ],
          {detached: true},
        );

        let done = false;

        subprocess.on("error", error => {
          if (!done) {
            reject(error);
            done = true;
          }
        });

        subprocess.on("exit", code => {
          if (!done) {
            if (code == null || code === 0) {
              resolve();
            } else {
              reject(
                new Error(
                  `"pg_ctl start" exited with code ${code}. Check "${logFile}" for more information.`,
                ),
              );
            }
            done = true;
          }
        });
      });
    }

    // If this is a fresh database then we need to create the database we will
    // connect to!
    if (freshDatabase) {
      await new Promise((resolve, reject) => {
        cp.exec(
          `createdb ${createClient.DATABASE} -p ${createClient.PORT}`,
          error => {
            if (error) reject(error);
            else resolve();
          },
        );
      });
    }

    // Always migrate the database! This will run the latest migrations. So when
    // the user pulls the repo down and runs this script, we’ll always apply the
    // latest migrations. Super convenient.
    await migrate();

    // If this is a fresh database then we also want to insert our mock data!
    if (freshDatabase) {
      // Get the mock data insertion query.
      const mockDataPath = path.resolve(
        __dirname,
        "..",
        "mocks",
        "mock-data.sql",
      );
      const mockData = await fs.readFile(mockDataPath, "utf8");

      console.log(`${chalk.grey("▸")} Inserting mock data`);

      // Connect a Postgres client, insert the mock data, and release our client.
      const client = createClient();
      try {
        await client.connect();
        await client.query("SET search_path = connect");
        await client.query(mockData);
      } finally {
        await client.end();
      }
    }
  } catch (error) {
    // If we threw while initializing a fresh database then delete the Postgres
    // data directory so that next run we will initialize the database
    // from scratch.
    if (freshDatabase) {
      await fs.remove(dataDir);
    }

    throw error;
  }
}

module.exports = start;

// Make unhandled promise exceptions an unhandled runtime exception.
if (!module.parent) {
  start().catch(error => {
    setImmediate(() => {
      throw error;
    });
  });
}
