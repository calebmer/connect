import "./initializeEnv";

import {APIServer} from "./APIServer";
import chalk from "chalk";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// Start listening to the API server!
APIServer.start(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Listening on ${chalk.bold.underline(`http://localhost:${PORT}`)}`,
  );
});
