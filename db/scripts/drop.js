/* eslint-disable no-console */

const readline = require("readline");
const chalk = require("chalk");
const createClient = require("./lib/createClient");

async function drop() {
  // Open up a readline interface to ask the user if they really want to drop
  // their database.
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const scary = chalk.red.bold;

  // Convert the `readline` question into a promise.
  await new Promise(resolve => {
    rl.question(
      `You are about to ${scary("permanently delete")} everything from your ` +
        `database! Be very careful. ` +
        `Type "${chalk.cyan("yes")}" to continue.\n` +
        `${chalk.grey("?")} `,
      answer => {
        // We are done with our readline interface.
        rl.close();

        if (answer.toLowerCase() === "yes") {
          resolve();
        } else {
          process.exit(0);
        }
      },
    );
  });

  // Connect a Postgres client.
  const client = createClient();
  try {
    await client.connect();

    // Drop everything including the migrations table.
    await client.query(`
      BEGIN;
      DROP SCHEMA IF EXISTS connect CASCADE;
      DROP ROLE IF EXISTS connect_api;
      DROP ROLE IF EXISTS connect_api_auth;
      DROP ROLE IF EXISTS connect_api_dangerous_security_bypass;
      DROP TABLE IF EXISTS connect_migration;
      COMMIT;
    `);

    // Let the user know their database was successfully dropped.
    console.log(`${chalk.grey("▸")} Database successfully dropped ♻️`);
  } finally {
    // Release our Postgres client.
    await client.end();
  }
}

module.exports = drop;

if (!module.parent) {
  // Make unhandled promise exceptions an unhandled runtime exception.
  drop().catch(error => {
    setImmediate(() => {
      throw error;
    });
  });
}
