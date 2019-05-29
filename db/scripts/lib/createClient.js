const pg = require("pg");

const PORT = 5000;
const DATABASE = "connect";

function createClient() {
  return new pg.Client({
    host: process.env.PGHOST,
    port: process.env.PGPORT || PORT,
    database: process.env.PGDATABASE || DATABASE,
    ssl: process.env.NODE_ENV === "production",
  });
}

createClient.PORT = PORT;
createClient.DATABASE = DATABASE;

module.exports = createClient;
