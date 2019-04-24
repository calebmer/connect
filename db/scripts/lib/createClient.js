const pg = require("pg");

const PORT = 5000;
const DATABASE = "connect";

function createClient() {
  return new pg.Client({
    port: process.env.PGPORT || PORT,
    database: process.env.PGDATABASE || DATABASE,
  });
}

createClient.PORT = PORT;
createClient.DATABASE = DATABASE;

module.exports = createClient;
