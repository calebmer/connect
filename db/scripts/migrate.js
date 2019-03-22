/* eslint-disable no-console */

const util = require("util");
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const {Client} = require("pg");

const readDir = util.promisify(fs.readdir);
const readFile = util.promisify(fs.readFile);

async function run({silent = false} = {}) {
  // Get all of our migrations.
  const migrationsDir = path.resolve(__dirname, "..", "migrations");
  const migrations = new Set(await readDir(migrationsDir));

  // Connect a Postgres client.
  const client = new Client();
  try {
    await client.connect();

    // Setup the migrations schema.
    await client.query(`
      BEGIN;

      CREATE SCHEMA IF NOT EXISTS connect;

      CREATE TABLE IF NOT EXISTS connect_migration (
        name TEXT PRIMARY KEY,
        run_at TIMESTAMP NOT NULL DEFAULT now()
      );

      COMMIT;
    `);

    // Begin a new transaction.
    await client.query("BEGIN");

    // All of the migrations which have already been run.
    const result = await client.query("SELECT name FROM connect_migration");

    // Remove all the rows from our `migrations` set which have already
    // been run.
    for (const row of result.rows) {
      migrations.delete(row.name);
    }

    // Set the search path to the connect schema. This way all the tables we
    // create will automatically be added to the connect schema.
    await client.query("SET search_path = connect");

    // Run all the migrations which have not yet been run.
    for (const name of migrations) {
      if (path.extname(name) !== ".sql") continue;

      if (!silent) {
        console.log(
          `${chalk.grey("▸")} Running migration ${chalk.cyan.bold(name)}`,
        );
      }

      const migrationPath = path.join(migrationsDir, name);
      const migrationFile = await readFile(migrationPath, "utf8");
      await client.query(migrationFile);
      await client.query({
        text: "INSERT INTO public.connect_migration (name) VALUES ($1)",
        values: [name],
      });
    }

    // Commit our transaction now that we’ve finished running all
    // our migrations.
    await client.query("COMMIT");
  } finally {
    // Release our Postgres client.
    await client.end();
  }
}

module.exports = run;

// Make unhandled promise exceptions an unhandled runtime exception.
if (!module.parent) {
  run().catch(error => {
    setImmediate(() => {
      throw error;
    });
  });
}
