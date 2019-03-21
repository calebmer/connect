/* eslint-disable no-console */

const util = require("util");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const {Client} = require("pg");
const runDrop = require("./drop");
const runMigrate = require("./migrate");

const readFile = util.promisify(fs.readFile);

async function run() {
  await runDrop();
  await runMigrate();

  // Get the mock data insertion query.
  const mockDataPath = path.resolve(__dirname, "..", "mocks", "mock-data.sql");
  const mockData = await readFile(mockDataPath, "utf8");

  console.log(`${chalk.grey("▸")} Inserting mock data`);

  // Connect a Postgres client, insert the mock data, and release our client.
  const client = new Client();
  try {
    await client.connect();
    await client.query("SET search_path = connect");
    await client.query(mockData);
  } finally {
    await client.end();
  }
}

async function maybeCreateDatabase(database) {
  // Create a new temporary client with the default connection settings.
  const tmpClient = new Client();
  try {
    await tmpClient.connect();
    const {rowCount} = await tmpClient.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [database],
    );
    if (rowCount < 1) {
      await tmpClient.query(`CREATE DATABASE "${database.replace('"', '""')}"`);
    }
  } finally {
    await tmpClient.end();
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
