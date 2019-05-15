import {APIServer} from "./APIServer";
import {PORT} from "./RunConfig";
import chalk from "chalk";

// Start listening to the API server!
APIServer.start(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Listening on ${chalk.bold.underline(`http://localhost:${PORT}`)}`,
  );
});
