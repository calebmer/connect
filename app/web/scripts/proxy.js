global.__DEV__ = process.env.NODE_ENV === "development";

const url = require("url");
const http = require("http");
const chalk = require("chalk");
const {proxyRequest, proxyUpgrade} = require("../lib/APIProxy");

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 7000;

const API_URL = (() => {
  if (!process.env.API_URL) {
    throw new Error("Expected an API URL.");
  }
  return url.parse(process.env.API_URL);
})();

const server = http.createServer((req, res) => {
  proxyRequest(API_URL, req, res);
});

server.on("upgrade", (req, socket, firstPacket) => {
  proxyUpgrade(API_URL, req, socket, firstPacket);
});

server.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(
    `Listening on ${chalk.bold.underline(`http://localhost:${PORT}`)}`,
  );
});
