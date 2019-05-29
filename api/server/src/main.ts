import "./initializeEnv";

import {APIServer} from "./APIServer";
import chalk from "chalk";
import https from "https";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// Start listening to the API server!
APIServer.start(PORT, server => {
  const protocol = server instanceof https.Server ? "https" : "http";

  // eslint-disable-next-line no-console
  console.log(
    `Listening on ${chalk.bold.underline(`${protocol}://localhost:${PORT}`)}`,
  );
});
