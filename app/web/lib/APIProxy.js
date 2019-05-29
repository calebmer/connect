/**
 * Our web API proxy is mounted on the `/api` route of our website and proxies
 * traffic to our API server. The API proxy is responsible for converting the
 * cookies stored by the browser into `Authorization` headers that the
 * API understands.
 *
 * For security, the browser JavaScript code _never_ has access to the access
 * token for our API. This way an XSS attack will not be able to take over a
 * user’s account.
 *
 * However, we don’t necessarily want our API to speak in cookies since the
 * native app on iOS and Android does directly store the access token in a
 * secure place on the mobile device’s disk.
 *
 * We take a lot of inspiration for the code of this API proxy
 * from [`http-proxy`][1].
 *
 * [1]: https://github.com/nodejitsu/node-http-proxy
 */

const http = require("http");
const cookie = require("cookie");
const jwt = require("jsonwebtoken");
const got = require("got");

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
  agent: apiProxyAgent,
  throwHttpErrors: false,
  json: true,
});

/**
 * Gets the access token from the request cookies and passes them to our
 * callback. If the access token or refresh token does not exist then we call
 * the callback with undefined.
 */
function getAccessToken(apiUrl, req, callback) {
  // We first try to parse the access and refresh tokens from our cookie. If
  // the access token has expired then we try to refresh it before sending
  // our request.
  let accessToken = undefined;
  let refreshToken = undefined;

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
      if (
        accessToken !== undefined &&
        Math.floor(Date.now() / 1000) >= jwt.decode(accessToken).exp - 30
      ) {
        refreshAccessToken();
      } else {
        // Otherwise our access token did not expire and we can send
        // our request.
        callback(null, accessToken, false);
      }
    } catch (error) {
      callback(error);
    }
  } else {
    // If we do not have a cookie header then send our request on its way!
    callback(null, accessToken, false);
  }

  /**
   * Generates a new access token before sending our request.
   */
  async function refreshAccessToken() {
    try {
      // Make the request to our API with `got` in JSON mode. We will want to
      // inspect the result of this request instead of simply streaming
      // it through.
      const apiResponse = await apiClient.post(
        {...apiUrl, path: "/account/refreshAccessToken"},
        {body: {refreshToken}},
      );

      const result = apiResponse.body;

      // If we did not get a successful API response then re-throw the error and
      // unset our cookies!
      if (result.ok !== true) {
        const error = new Error("Failed to refresh access token.");
        error.statusCode = apiResponse.statusCode;
        error.apiError = result.error;
        error.resetTokens = true;
        throw error;
      }

      // Retrieve the new access token.
      const newAccessToken = result.data.accessToken;

      // Set the access token in our closure to the new access token.
      accessToken = newAccessToken;
    } catch (error) {
      callback(error);
      return;
    }

    // Yay! Now that we have a non-expired access token we can actually send
    // our API request.
    callback(null, accessToken, true);
  }
}

/**
 * Proxies a request to our API.
 *
 * Adds special handling for authorization. When signing in we will attach our
 * tokens to a cookie. Future requests will use those cookies to authorize us
 * with the API.
 */
function proxyRequest(apiUrl, req, res, pathname) {
  if (req.method === "POST") {
    if (pathname === "/account/signUp" || pathname === "/account/signIn") {
      proxySignInRequest(apiUrl, req, res, pathname);
      return;
    }
    if (pathname === "/account/signOut") {
      proxySignOutRequest(apiUrl, req, res);
      return;
    }
  }
  proxyNormalRequest(apiUrl, req, res, pathname);
}

/**
 * Simply proxies a request to our API. We use the low-level HTTP library for
 * this since we really need to be fast.
 */
function proxyNormalRequest(apiUrl, req, res, pathname) {
  getAccessToken(apiUrl, req, (error, accessToken, newAccessToken) => {
    // If our request failed then handle the error...
    if (error) {
      handleError(res, error);
      return;
    }

    if (newAccessToken && accessToken !== undefined) {
      // Set our cookie with the updated access token. This way we won’t
      // need to generate an access token for every request. We can use
      // this one for the next hour or so.
      res.setHeader(
        "Set-Cookie",
        cookie.serialize("access_token", accessToken, cookieSettings),
      );
    }

    // Construct the actual HTTP request...
    const apiRequest = http.request({
      protocol: apiUrl.protocol,
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      agent: apiProxyAgent,
      method: req.method,
      path: pathname,
    });

    apiRequest.on("error", error => {
      handleError(res, error);
    });

    apiRequest.on("response", handleResponse);

    // Copy headers we’re ok with proxying to our request options.
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const header = req.rawHeaders[i];
      if (apiProxyHeaders.has(header.toLowerCase())) {
        apiRequest.setHeader(header, req.rawHeaders[i + 1]);
      }
    }

    // Add an authorization header with our access token (from a cookie) to the
    // API request.
    if (accessToken !== undefined) {
      apiRequest.setHeader("Authorization", `Bearer ${accessToken}`);
    }

    // Add the `Forwarded` header to our request so the API server knows who
    // the request was originally from.
    apiRequest.setHeader("Forwarded", getForwardedHeader(req));

    // Pipe the body we received into the proxy request body.
    req.pipe(apiRequest);

    // When we get a response pipe it to our actual HTTP response so our browser
    // can use it.
    function handleResponse(apiResponse) {
      // Copy the status code and headers from our proxy response.
      res.statusCode = apiResponse.statusCode;
      for (let i = 0; i < apiResponse.rawHeaders.length; i += 2) {
        res.setHeader(apiResponse.rawHeaders[i], apiResponse.rawHeaders[i + 1]);
      }

      // Send the body to our actual response.
      apiResponse.pipe(res);
    }
  });
}

/**
 * A token cookie lives for 100 years. We have other mechanisms of expiring and
 * invalidating tokens besides cookie expiration.
 */
const tokenCookieMaxAge = 60 * 60 * 24 * 365 * 100;

/**
 * Out cookie settings.
 */
const cookieSettings = {
  path: "/api",
  httpOnly: true,
  secure: !__DEV__,
  sameSite: "strict",
  maxAge: tokenCookieMaxAge,
};

/**
 * Immediately expires a cookie. Inherits from `cookieSettings`.
 */
const cookieExpireSettings = {
  ...cookieSettings,
  maxAge: 0,
};

/**
 * Proxies a request to sign the person in. We want to intercept the response
 * body and
 */
async function proxySignInRequest(apiUrl, req, res, pathname) {
  try {
    // Make the request to our API with `got` in JSON mode. We will want to
    // inspect the result of this request instead of simply streaming
    // it through.
    const apiResponse = await apiClient.post(
      {...apiUrl, path: pathname},
      {
        json: false,
        headers: {
          "Content-Type": "application/json",
          Forwarded: getForwardedHeader(req),
        },
        body: req,
      },
    );

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
      cookie.serialize("access_token", result.data.accessToken, cookieSettings),
      cookie.serialize(
        "refresh_token",
        result.data.refreshToken,
        cookieSettings,
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

/**
 * Proxies a request to sign the person out. Handles the destroying of access
 * tokens and the cookies which contain them.
 *
 * NOTE: We ignore the refresh token given to us by our API client, instead
 * using the stored in a cookie.
 */
async function proxySignOutRequest(apiUrl, req, res) {
  try {
    // Parse the refresh token from our cookie header.
    const cookieHeader = req.headers.cookie;
    let refreshToken;
    if (cookieHeader !== undefined) {
      const result = cookie.parse(cookieHeader);
      refreshToken = result.refresh_token;
    }

    // No matter whether our not our API request to sign out succeeds or fails,
    // we must expire the access token and refresh token cookies. So set
    // those headers.
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Set-Cookie", [
      cookie.serialize("access_token", "", cookieExpireSettings),
      cookie.serialize("refresh_token", "", cookieExpireSettings),
    ]);

    // If we have a refresh token then send it to our actual API so that the
    // refresh token may be destroyed.
    if (refreshToken !== undefined) {
      const apiResponse = await apiClient.post(
        {...apiUrl, path: "/account/signOut"},
        {
          headers: {Forwarded: getForwardedHeader(req)},
          body: {refreshToken},
        },
      );

      // If the sign out request failed then forward the result to our response.
      if (apiResponse.body.ok !== true) {
        res.statusCode = apiResponse.statusCode;
        res.write(JSON.stringify(apiResponse.body));
        res.end();
        return;
      }
    }

    // If we succeeded then send an ok response back down to our client.
    res.statusCode = 200;
    res.write(JSON.stringify({ok: true, data: {}}));
    res.end();
  } catch (error) {
    handleError(res, error);
  }
}

/**
 * Handles an error and sends that error to our response.
 */
function handleError(res, error) {
  if (!__TEST__) {
    if (!error.apiError) {
      // Log the error for debugging purposes.
      logError(error);
    }
  }

  res.statusCode = error.statusCode || 500;
  res.setHeader("Content-Type", "application/json");

  // If we were told to reset tokens then add a header which will unset
  // the tokens.
  if (error.resetTokens) {
    res.setHeader("Set-Cookie", [
      cookie.serialize("access_token", "", cookieExpireSettings),
      cookie.serialize("refresh_token", "", cookieExpireSettings),
    ]);
  }

  if (error.apiError) {
    res.write(
      JSON.stringify({
        ok: false,
        error: error.apiError,
      }),
    );
  } else {
    res.write(
      JSON.stringify({
        ok: false,
        error: {
          code: "UNKNOWN",

          // If we are in development mode then include the stack of our error
          // from the server. This should help in debugging why an error ocurred.
          serverStack:
            __DEV__ && error instanceof Error ? error.stack : undefined,
        },
      }),
    );
  }

  res.end();
}

/**
 * Logs an error to the console.
 */
function logError(error) {
  // eslint-disable-next-line no-console
  console.error(
    error instanceof Error ? error.stack || error.message : String(error),
  );
}

/**
 * Proxies a WebSocket upgrade to our API.
 */
function proxyUpgrade(apiUrl, req, socket, firstPacket) {
  // WebSocket requests must use the `GET` method and must have the
  // `Upgrade: websocket` header.
  if (
    req.method !== "GET" ||
    !req.headers.upgrade ||
    req.headers.upgrade.toLowerCase() !== "websocket"
  ) {
    writeResponse(400);
    return;
  }

  setupSocket(socket);

  // If the socket errs then log it instead of crashing the process.
  socket.on("error", error => {
    logError(error);
  });

  // The first packet was read from our socket. This “un-reads” the packet by
  // putting it back in the socket’s readable stream.
  if (firstPacket && firstPacket.length) {
    socket.unshift(firstPacket);
  }

  // We need access to these variables here but we only get them asynchronously
  // in our callback.
  let accessToken;
  let newAccessToken = false;

  getAccessToken(apiUrl, req, (error, _accessToken, _newAccessToken) => {
    // If there was an error while trying to fetch our access token write an
    // error response to our socket...
    if (error) {
      const statusCode = error.statusCode || 500;
      const rawHeaders = [];
      if (error.resetTokens) {
        rawHeaders.push(
          "Set-Cookie",
          cookie.serialize("access_token", "", cookieExpireSettings),
        );
        rawHeaders.push(
          "Set-Cookie",
          cookie.serialize("refresh_token", "", cookieExpireSettings),
        );
      }
      writeResponse(statusCode, rawHeaders);
      return;
    }

    accessToken = _accessToken;
    newAccessToken = _newAccessToken;

    // Construct the HTTP request which should trigger an upgrade...
    const apiRequest = http.request({
      protocol: apiUrl.protocol,
      hostname: apiUrl.hostname,
      port: apiUrl.port,
      agent: apiProxyAgent,
      method: req.method,
      path: accessToken ? `/?access_token=${accessToken}` : "",
    });

    apiRequest.on("error", error => {
      logError(error);
      socket.end();
    });

    apiRequest.on("response", handleResponse);
    apiRequest.on("upgrade", handleUpgrade);

    // Copy headers we’re ok with proxying to our request options.
    for (let i = 0; i < req.rawHeaders.length; i += 2) {
      const header = req.rawHeaders[i];
      apiRequest.setHeader(header, req.rawHeaders[i + 1]);
    }

    // Add the `Forwarded` header to our request so the API server knows who
    // the request was originally from.
    apiRequest.setHeader("Forwarded", getForwardedHeader(req));

    // Send the API request!
    apiRequest.end();

    /**
     * We only really need to handle the response when we aren’t going to be
     * upgrading to WebSockets. If we aren’t upgrading then we want to send over
     * the HTTP response and the rest of the body.
     */
    function handleResponse(apiResponse) {
      // If upgrade event isn't going to happen, close the socket...
      if (!apiResponse.upgrade) {
        // Write the HTTP headers from our API response to the socket.
        writeHead(apiResponse.statusCode, apiResponse.rawHeaders);

        // Pipe the rest of the API response to our socket...
        apiResponse.pipe(socket);
      }
    }

    /**
     * If the HTTP request upgrades then we handle it with this function. We
     * respond to our client with an HTTP 101 status code and pipe the API socket
     * to our client’s socket.
     */
    function handleUpgrade(apiResponse, apiSocket, apiFirstPacket) {
      apiSocket.on("error", error => {
        logError(error);
        socket.end();
      });

      socket.on("error", error => {
        logError(error);
        apiSocket.end();
      });

      setupSocket(apiSocket);

      // The first packet was read from our socket. This “un-reads” the packet by
      // putting it back in the socket’s readable stream.
      if (apiFirstPacket && apiFirstPacket.length) {
        apiSocket.unshift(apiFirstPacket);
      }

      // Write the HTTP headers from our API response to the socket.
      writeHead(101, apiResponse.rawHeaders);

      // Pipe the sockets together! Yay we did it!
      apiSocket.pipe(socket).pipe(apiSocket);
    }
  });

  /**
   * Writes an HTTP head to our socket. We ask for the raw headers array
   * format that Node.js provides so that we use the same casing as our request.
   */
  function writeHead(statusCode, rawHeaders) {
    let head = `HTTP/1.1 ${statusCode} ${http.STATUS_CODES[statusCode]}\r\n`;

    // Add all of our raw headers...
    for (let i = 0; i < rawHeaders.length; i += 2) {
      head += `${rawHeaders[i]}: ${rawHeaders[i + 1]}\r\n`;
    }

    // When writing the head if we have a new access token let’s add a
    // `Set-Cookie` header...
    if (newAccessToken && accessToken !== undefined) {
      // Set our cookie with the updated access token. This way we won’t
      // need to generate an access token for every request. We can use
      // this one for the next hour or so.
      head += `Set-Cookie: ${cookie.serialize(
        "access_token",
        accessToken,
        cookieSettings,
      )}\r\n`;
    }

    head += "\r\n";

    socket.write(head);
  }

  /**
   * Writes an entire plain text response to our socket. We ask for a headers
   * object and convert it to a raw headers array.
   */
  function writeResponse(
    statusCode,
    rawHeaders = [],
    bodyText = http.STATUS_CODES[statusCode],
  ) {
    // Write the head to our socket...
    writeHead(statusCode, [
      "Connection",
      "close",
      "Content-Type",
      "text/html",
      "Content-Length",
      Buffer.byteLength(bodyText),
      ...rawHeaders,
    ]);

    // Write the body to our socket...
    socket.write(bodyText);

    // We are done with our socket so end it!
    socket.end();
  }
}

/**
 * Setup a socket for a long lived WebSocket connection.
 */
function setupSocket(socket) {
  socket.setTimeout(0);
  socket.setNoDelay(true);
  socket.setKeepAlive(true, 0);
}

module.exports = {
  proxyRequest,
  proxyUpgrade,
};

/**
 * Get the [`Forwarded` header][1] for this request. If one already exists then
 * we add to it.
 *
 * [1]: https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Forwarded
 */
function getForwardedHeader(req) {
  // Derived information about this request.
  const isEncrypted = req.connection.encrypted || req.connection.pair;
  const isWebSocket =
    req.headers.upgrade && req.headers.upgrade.toLowerCase() === "websocket";

  // Some identifier for the connection making this request.
  const forwardedFor = req.connection.remoteAddress || req.socket.remoteAddress;

  // The protocol used by this request...
  let forwardedProtocol;
  if (isWebSocket) {
    forwardedProtocol = isEncrypted ? "wss" : "ws";
  } else {
    forwardedProtocol = isEncrypted ? "https" : "http";
  }

  // Assemble the new part of the `Forwarded` header.
  const forwardedHead = `for=${forwardedFor};proto=${forwardedProtocol}`;

  // Get the old part of the `Forwarded` header.
  let forwardedTail = req.headers.forwarded;
  if (Array.isArray(forwardedTail)) {
    forwardedTail = forwardedTail.join(", ");
  }

  // Combine the previous forwarded header with the new one.
  if (forwardedTail != null) {
    return `${forwardedHead}, ${forwardedTail}`;
  } else {
    return forwardedHead;
  }
}
