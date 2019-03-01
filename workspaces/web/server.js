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

    // If the client is trying to make an API request...
    if (request.method === "POST" && url.pathname.startsWith("/api")) {
      apiProxy(request, response, url.pathname.slice(4));
      return;
    }

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

/**
 * The URL of our API on the internet! We will proxy post requests on `/api` for
 * our server to this URL.
 *
 * TODO: Make this configurable
 */
const apiUrl = parseUrl("http://localhost:4000");

/**
 * Proxy these headers when calling our API.
 */
const apiProxyHeaders = new Set([
  "content-type",
  "content-length",
  "accept-encoding",
]);

/**
 * Our API proxy agent will keep alive TCP connections so we don’t have to keep
 * reconnecting them.
 */
const apiProxyAgent = new http.Agent({keepAlive: true});

/**
 * Proxies a POST request to our API.
 *
 * Adds special handling for authorization. When signing in we will attach our
 * tokens to a cookie. Future requests will use those cookies to authorize us
 * with the API.
 */
function apiProxy(request, response, pathname) {
  // Options for the HTTP request to our proxy.
  const proxyRequestOptions = {
    protocol: apiUrl.protocol,
    hostname: apiUrl.hostname,
    port: apiUrl.port,
    agent: apiProxyAgent,
    method: "POST",
    path: pathname,
    headers: {},
  };

  // Copy headers we’re ok with proxying to our request options.
  for (let i = 0; i < request.rawHeaders.length; i += 2) {
    const header = request.rawHeaders[i];
    if (apiProxyHeaders.has(header.toLowerCase())) {
      proxyRequestOptions.headers[header] = request.rawHeaders[i + 1];
    }
  }

  // Make the request. When we get a response pipe it to our actual HTTP
  // response so our browser can use it.
  const proxyRequest = http.request(proxyRequestOptions, proxyResponse => {
    // Copy the status code and headers from our proxy response.
    response.statusCode = proxyResponse.statusCode;
    for (let i = 0; i < proxyResponse.rawHeaders.length; i += 2) {
      response.setHeader(
        proxyResponse.rawHeaders[i],
        proxyResponse.rawHeaders[i + 1],
      );
    }
    // Send the body to our actual response.
    proxyResponse.pipe(response);
  });

  // Pipe the body we received into the proxy request body.
  request.pipe(proxyRequest);
}
