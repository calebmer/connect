import chalk from "chalk";
import {APIServer} from "./APIServer";

// The port our API server will be listening on.
const port = process.env.PORT || 4000;

APIServer.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(
    `${chalk.grey("▸")} Ready on ` +
      `${chalk.bold.underline(`http://localhost:${port}`)}`,
  );
});
