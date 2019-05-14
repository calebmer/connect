// NOTE: These two modules are installed to make the `ws` module faster.
import "bufferutil";
import "utf-8-validate";

import {APIServer, detectBrokenConnections} from "./APIServer";
import {PORT} from "./RunConfig";
import chalk from "chalk";

// Start listening to the API server!
APIServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Listening on ${chalk.bold.underline(`http://localhost:${PORT}`)}`,
  );
});

// Every 30 seconds, ping all of our web socket clients. If a client doesn’t
// send a “pong” back then the next time we try to ping that client we will
// instead terminate the client.
setInterval(() => {
  detectBrokenConnections();
}, 30 * 1000);
