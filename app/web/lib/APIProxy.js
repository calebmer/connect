const {parse: parseUrl} = require("url");
const http = require("http");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const got = require("got");
const {DEV, API_URL} = require("./RunConfig");

/**
 * The URL of our API on the internet! We will proxy post requests on `/api` for
 * our server to this URL.
 */
const apiUrl = parseUrl(API_URL);

/**
 * Proxy these headers when calling our API.
 *
 * All headers are in lowercase for easy matching.
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
 * Extend `got` with some default settings.
 */
const apiClient = got.extend({
  baseUrl: API_URL,
  agent: apiProxyAgent,
  throwHttpErrors: false,
  json: true,
});

/**
 * Proxies a request to our API.
 *
 * Adds special handling for authorization. When signing in we will attach our
 * tokens to a cookie. Future requests will use those cookies to authorize us
 * with the API.
 */
function APIProxy(req, res, pathname) {
  if (pathname === "/account/signUp" || pathname === "/account/signIn") {
    proxySignInRequest(req, res, pathname);
  } else {
    proxyRequest(req, res, pathname);
  }
}

module.exports = {
  APIProxy,
};

/**
 * Simply proxies a request to our API. We use the low-level HTTP library for
 * this since we really need to be fast.
 */
function proxyRequest(req, res, pathname) {
  // We first try to parse the access and refresh tokens from our cookie. If
  // the access token has expired then we try to refresh it before sending
  // our request.
  let accessToken;
  let refreshToken;

  // Parse the access token and refresh token from the request cookies.
  const cookieHeader = req.headers.cookie;
  if (cookieHeader !== undefined) {
    try {
      // Parse our cookie header.
      const result = cookie.parse(cookieHeader);
      accessToken = result.access_token;
      refreshToken = result.refresh_token;

      // If the access token has expired then we need to generate a new access
      // token! We refresh the token even if the token will only expire in 30
      // seconds. That’s to factor in network latency. We want to avoid the
      // token expiring while in flight to our API server.
      if (Math.floor(Date.now() / 1000) >= jwt.decode(accessToken).exp - 30) {
        refreshAccessToken();
      } else {
        // Otherwise our access token did not expire and we can send
        // our request.
        sendRequest();
      }
    } catch (error) {
      handleError(res, error);
    }
  } else {
    // If we do not have a cookie header then send our request on its way!
    sendRequest();
  }

  /**
   * Sends the request we are proxying to our API server. We might have to
   * refresh our access token before we can proxy a request.
   */
  function sendRequest() {
    // Options for the HTTP request to our proxy.
    const requestOptions = {
      protocol: apiUrl.protocol,
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      agent: apiProxyAgent,
      method: "POST",
      path: pathname,
    };

    // Make the request.
    const request = http.request(requestOptions, handleResponse);

    // Copy headers we’re ok with proxying to our request options.
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const header = req.rawHeaders[i];
      if (apiProxyHeaders.has(header.toLowerCase())) {
        request.setHeader(header, req.rawHeaders[i + 1]);
      }
    }

    // Add an authorization header with our access token (from a cookie) to the
    // API request.
    if (accessToken !== undefined) {
      proxyRequest.setHeader("Authorization", `Bearer ${accessToken}`);
    }

    // Pipe the body we received into the proxy request body.
    req.pipe(request);
  }

  // When we get a response pipe it to our actual HTTP response so our browser
  // can use it.
  function handleResponse(response) {
    // Copy the status code and headers from our proxy response.
    res.statusCode = response.statusCode;
    for (let i = 0; i < response.rawHeaders.length; i += 2) {
      res.setHeader(response.rawHeaders[i], response.rawHeaders[i + 1]);
    }

    // Send the body to our actual response.
    response.pipe(res);
  }

  /**
   * Generates a new access token before sending our request.
   */
  async function refreshAccessToken() {
    try {
      // Make the request to our API with `got` in JSON mode. We will want to
      // inspect the result of this request instead of simply streaming
      // it through.
      const apiResponse = await apiClient.post("/account/refreshAccessToken", {
        body: {refreshToken},
      });

      // If we did not get a successful API response then throw an error.
      if (apiResponse.body.ok !== true) {
        throw new Error("Expected a successful API response.");
      }

      // Retrieve the new access token.
      const newAccessToken = apiResponse.body.data.accessToken;

      // Set our cookie with the updated access token. This way we won’t
      // need to generate an access token for every request. We can use
      // this one for the next hour or so.
      res.setHeader(
        "Set-Cookie",
        cookie.serialize(
          "access_token",
          newAccessToken,
          accessTokenCookieSettings,
        ),
      );

      // Set the access token in our closure to the new access token.
      accessToken = newAccessToken;
    } catch (error) {
      handleError(res, error);
    }

    // Yay! Now that we have a non-expired access token we can actually send
    // our API request.
    sendRequest();
  }
}

/**
 * A token cookie lives for 100 years. We have other mechanisms of expiring and
 * invalidating tokens besides cookie expiration.
 */
const tokenCookieMaxAge = 60 * 60 * 24 * 365 * 100;

/**
 * The cookie settings for a refresh token.
 */
const refreshTokenCookieSettings = {
  path: "/api",
  httpOnly: true,
  secure: !DEV,
  sameSite: "strict",
  maxAge: tokenCookieMaxAge,
};

/**
 * The cookie settings for an access token.
 */
const accessTokenCookieSettings = {
  path: "/api",
  httpOnly: true,
  secure: !DEV,
  sameSite: "strict",
  maxAge: tokenCookieMaxAge,
};

/**
 * Proxies a request to sign the person in. We want to intercept the response
 * body and
 */
async function proxySignInRequest(req, res, pathname) {
  try {
    // Make the request to our API with `got` in JSON mode. We will want to
    // inspect the result of this request instead of simply streaming
    // it through.
    const apiResponse = await apiClient.post(pathname, {
      json: false,
      headers: {"Content-Type": "application/json"},
      body: req,
    });

    // Attempt to parse the API response body.
    const result = JSON.parse(apiResponse.body);

    // If we got a not-ok response then send the response exactly back to
    // our browser.
    if (result.ok !== true) {
      res.statusCode = apiResponse.statusCode;
      res.setHeader("Content-Type", "application/json");
      res.write(JSON.stringify(result));
      res.end();
      return;
    }

    // Set our refresh token and access token as secure cookies. HTTP-only
    // is very important here as it avoids XSS security vulnerabilities!
    //
    // Since refresh tokens are very dangerous in the wrong hands we also
    // force the cookie to only be sent over secure contexts.
    res.setHeader("Set-Cookie", [
      cookie.serialize(
        "refresh_token",
        result.data.refreshToken,
        refreshTokenCookieSettings,
      ),
      cookie.serialize(
        "access_token",
        result.data.accessToken,
        accessTokenCookieSettings,
      ),
    ]);

    // Send an ok response to our client. We remove the refresh and access
    // tokens from the response body so that client-side code will never
    // have access to them.
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.write(
      JSON.stringify({
        ok: true,
        data: {
          accessToken: "",
          refreshToken: "",
        },
      }),
    );
    res.end();
  } catch (error) {
    // Send an unknown error to the client.
    handleError(res, error);
  }
}

function handleError(res, error) {
  // Log the error for debugging purposes.
  // eslint-disable-next-line no-console
  console.error(error.stack);

  // Send an unknown error to the client.
  res.statusCode = 500;
  res.setHeader("Content-Type", "application/json");
  res.write(
    JSON.stringify({
      ok: false,
      error: {code: "UNKNOWN"},
    }),
  );
  res.end();
}
