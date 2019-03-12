import {APIServer} from "./APIServer";
import {PORT} from "./RunConfig";
import chalk from "chalk";

APIServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `${chalk.grey("▸")} Ready on ` +
      `${chalk.bold.underline(`http://localhost:${PORT}`)}`,
  );
});
