const fs = require("fs-extra");
const debug = require("debug")("connect:test:pg");

module.exports = async () => {
  const {tempDir, subprocess} = global.__PG_TEST__;

  debug("Killing Postgres process");
  subprocess.kill();

  debug("Cleaning up temporary directory");
  await fs.remove(tempDir);
};
