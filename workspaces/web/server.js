const http = require("http");
const {parse: parseUrl} = require("url");
const chalk = require("chalk");
const next = require("next");

// The port our web server will be listening on.
const port = process.env.PORT || 3000;

// Are we in production?
const dev = process.env.NODE_ENV !== "production";

// Create our Next.js app
const app = next({dev});
const handle = app.getRequestHandler();

async function run() {
  // Wait for Next.js to do its preparation stuff.
  await app.prepare();

  // Create our HTTP server. We want to proxy all requests to `/api` to our
  // actual API. We proxy all requests through a server so that we can keep our
  // client secret, well, secret. We’re also able to put our access tokens in
  // cookies out of reach from malicious client side scripts.
  const server = http.createServer((request, response) => {
    // Parse the url.
    const url = parseUrl(request.url, true);

    // Let Next.js handle everything else.
    handle(request, response, url);
  });

  // Start listening to requests on our provided port.
  server.listen(port, error => {
    if (error) throw error;

    // eslint-disable-next-line no-console
    console.log(
      `${chalk.grey("▸")} Ready on ` +
        `${chalk.bold.underline(`http://localhost:${port}`)}`,
    );
  });
}

// Call main and promote any uncaught promise exceptions to uncaught
// JS exceptions.
run().catch(error => {
  setImmediate(() => {
    throw error;
  });
});
