/* eslint-disable no-console */

const util = require("util");
const path = require("path");
const fs = require("fs");
const chalk = require("chalk");
const createClient = require("./lib/createClient");
const drop = require("./drop");
const migrate = require("./migrate");

const readFile = util.promisify(fs.readFile);

async function reset() {
  await drop();
  await migrate();

  // Get the mock data insertion query.
  const mockDataPath = path.resolve(__dirname, "..", "mocks", "mock-data.sql");
  const mockData = await readFile(mockDataPath, "utf8");

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

module.exports = reset;

// Make unhandled promise exceptions an unhandled runtime exception.
if (!module.parent) {
  reset().catch(error => {
    setImmediate(() => {
      throw error;
    });
  });
}
