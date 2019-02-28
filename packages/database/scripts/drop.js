/* eslint-disable no-console */

const readline = require("readline");
const chalk = require("chalk");
const {Client} = require("pg");

// Open up a readline interface to ask the user if they really want to drop
// their database.
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const scary = chalk.red.bold;

rl.question(
  `You are about to ${scary("permanently delete")} everything from your ` +
    `database! Be very careful. ` +
    `Type "${chalk.cyan("yes")}" to continue.\n` +
    `${chalk.grey("?")} `,
  answer => {
    // We are done with our readline interface.
    rl.close();

    if (answer.toLowerCase() === "yes") {
      // Make unhandled promise exceptions an unhandled runtime exception.
      run().catch(error => {
        setImmediate(() => {
          throw error;
        });
      });
    }
  },
);

async function run() {
  // Connect a Postgres client.
  const client = new Client();
  await client.connect();

  // Drop everything including the migrations table.
  await client.query(`
    BEGIN;
    DROP SCHEMA IF EXISTS connect CASCADE;
    DROP TABLE IF EXISTS connect_migration;
    COMMIT;
  `);

  // Release our Postgres client.
  await client.end();

  // Let the user know their database was successfully dropped.
  console.log(`${chalk.grey("▸")} Database successfully dropped ♻️`);
}