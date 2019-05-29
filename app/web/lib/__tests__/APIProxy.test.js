/* eslint-disable consistent-return */

// Test production responses!
global.__DEV__ = false;

const url = require("url");
const http = require("http");
const jwt = require("jsonwebtoken");
const WebSocket = require("ws");
const nock = require("nock");
const request = require("supertest");
const {proxyRequest, proxyUpgrade} = require("../APIProxy");

describe("HTTP", () => {
  const API_URL = "http://localhost:4000";
  const apiUrl = url.parse(API_URL);

  const APIProxy = http.createServer((req, res) => {
    proxyRequest(apiUrl, req, res, url.parse(req.url).pathname);
  });

  beforeAll(() => {
    APIProxy.listen(0);
    nock.disableNetConnect();
    nock.enableNetConnect(`127.0.0.1:${APIProxy.address().port}`);
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  test("proxies a plain GET / 200 request", async () => {
    nock(API_URL)
      .get("/")
      .reply(200, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .get("/")
      .expect("Content-Type", "application/json")
      .expect(200, {works: true});
  });

  test("proxies a plain POST / 200 request", async () => {
    nock(API_URL)
      .post("/")
      .reply(200, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .post("/")
      .expect("Content-Type", "application/json")
      .expect(200, {works: true});
  });

  test("proxies a plain GET / 400 request", async () => {
    nock(API_URL)
      .get("/")
      .reply(400, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .get("/")
      .ok(() => true)
      .expect("Content-Type", "application/json")
      .expect(400, {works: true});
  });

  test("proxies a plain POST / 400 request", async () => {
    nock(API_URL)
      .post("/")
      .reply(400, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .post("/")
      .ok(() => true)
      .expect("Content-Type", "application/json")
      .expect(400, {works: true});
  });

  test("proxies a plain GET / 500 request", async () => {
    nock(API_URL)
      .get("/")
      .reply(500, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .get("/")
      .ok(() => true)
      .expect("Content-Type", "application/json")
      .expect(500, {works: true});
  });

  test("proxies a plain POST / 500 request", async () => {
    nock(API_URL)
      .post("/")
      .reply(500, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .post("/")
      .ok(() => true)
      .expect("Content-Type", "application/json")
      .expect(500, {works: true});
  });

  test("proxies a plain GET /yolo 200 request", async () => {
    nock(API_URL)
      .get("/yolo")
      .reply(200, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .get("/yolo")
      .expect("Content-Type", "application/json")
      .expect(200, {works: true});
  });

  test("proxies a plain POST /yolo 200 request", async () => {
    nock(API_URL)
      .post("/yolo")
      .reply(200, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .post("/yolo")
      .expect("Content-Type", "application/json")
      .expect(200, {works: true});
  });

  test("proxies a plain GET /yolo 400 request", async () => {
    nock(API_URL)
      .get("/yolo")
      .reply(400, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .get("/yolo")
      .ok(() => true)
      .expect("Content-Type", "application/json")
      .expect(400, {works: true});
  });

  test("proxies a plain POST /yolo 400 request", async () => {
    nock(API_URL)
      .post("/yolo")
      .reply(400, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .post("/yolo")
      .ok(() => true)
      .expect("Content-Type", "application/json")
      .expect(400, {works: true});
  });

  test("proxies a plain GET /yolo 500 request", async () => {
    nock(API_URL)
      .get("/yolo")
      .reply(500, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .get("/yolo")
      .ok(() => true)
      .expect("Content-Type", "application/json")
      .expect(500, {works: true});
  });

  test("proxies a plain POST /yolo 500 request", async () => {
    nock(API_URL)
      .post("/yolo")
      .reply(500, {works: true}, {"Content-Type": "application/json"});

    await request(APIProxy)
      .post("/yolo")
      .ok(() => true)
      .expect("Content-Type", "application/json")
      .expect(500, {works: true});
  });

  test("proxies the Content-Type header", async () => {
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {works: this.req.headers["content-type"]};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Content-Type", "yolo/yolo")
      .expect(200, {works: "yolo/yolo"});
  });

  test("proxies the Content-Length header", async () => {
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {works: this.req.headers["content-length"]};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .send("test")
      .expect(200, {works: "4"});
  });

  test("proxies the Accept-Encoding header", async () => {
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {works: this.req.headers["accept-encoding"]};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Accept-Encoding", "gzip")
      .expect(200, {works: "gzip"});
  });

  test("does not proxy arbitrary request headers", async () => {
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {works: !this.req.headers["x-yolo"]};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("X-Yolo", "yolo")
      .expect(200, {works: true});
  });

  test("proxies all response headers", async () => {
    nock(API_URL)
      .get("/")
      .reply(
        200,
        {works: true},
        {"Content-Type": "application/json", "X-Yolo": "swag"},
      );

    await request(APIProxy)
      .get("/")
      .expect("X-Yolo", "swag")
      .expect(200, {works: true});
  });

  test("does not add an authorization header if there’s no access token cookie", async () => {
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {authorization: this.req.headers["authorization"] || null};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Cookie", "refresh_token=yolo-swag")
      .expect(200, {authorization: null});
  });

  test("adds an authorization header if there’s an access token cookie", async () => {
    const accessToken = await new Promise((resolve, reject) => {
      jwt.sign({works: true}, "yolo-swag", (error, accessToken) => {
        if (error) reject(error);
        else resolve(accessToken);
      });
    });
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {authorization: this.req.headers["authorization"] || null};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Cookie", `access_token=${accessToken}`)
      .expect(200, {authorization: `Bearer ${accessToken}`});
  });

  test("adds an authorization header if there’s a non-expired access token cookie", async () => {
    const accessToken = await new Promise((resolve, reject) => {
      jwt.sign(
        {works: true},
        "yolo-swag",
        {expiresIn: "1h"},
        (error, accessToken) => {
          if (error) reject(error);
          else resolve(accessToken);
        },
      );
    });
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {authorization: this.req.headers["authorization"] || null};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Cookie", `access_token=${accessToken}`)
      .expect(200, {authorization: `Bearer ${accessToken}`});
  });

  test("adds an authorization header if there’s a non-expired access token cookie which expires soon", async () => {
    const accessToken = await new Promise((resolve, reject) => {
      jwt.sign(
        {works: true},
        "yolo-swag",
        {expiresIn: "40s"},
        (error, accessToken) => {
          if (error) reject(error);
          else resolve(accessToken);
        },
      );
    });
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {authorization: this.req.headers["authorization"] || null};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Cookie", `access_token=${accessToken}`)
      .expect(200, {authorization: `Bearer ${accessToken}`});
  });

  test("refreshes the access token when it has expired", async () => {
    const accessToken = await new Promise((resolve, reject) => {
      jwt.sign(
        {works: true},
        "yolo-swag",
        {expiresIn: "-1h"},
        (error, accessToken) => {
          if (error) reject(error);
          else resolve(accessToken);
        },
      );
    });
    nock(API_URL)
      .post("/account/refreshAccessToken")
      .reply(
        200,
        (_url, body) => ({
          ok: true,
          data: {accessToken: body.refreshToken},
        }),
        {"Content-Type": "application/json"},
      );
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {authorization: this.req.headers["authorization"] || null};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Cookie", `access_token=${accessToken}; refresh_token=yolo-swag`)
      .expect(
        "Set-Cookie",
        "access_token=yolo-swag; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
      )
      .expect(200, {authorization: `Bearer yolo-swag`});
  });

  test("refreshes the access token when it has just expired", async () => {
    const accessToken = await new Promise((resolve, reject) => {
      jwt.sign(
        {works: true},
        "yolo-swag",
        {expiresIn: "0"},
        (error, accessToken) => {
          if (error) reject(error);
          else resolve(accessToken);
        },
      );
    });
    nock(API_URL)
      .post("/account/refreshAccessToken")
      .reply(
        200,
        (_url, body) => ({
          ok: true,
          data: {accessToken: body.refreshToken},
        }),
        {"Content-Type": "application/json"},
      );
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {authorization: this.req.headers["authorization"] || null};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Cookie", `access_token=${accessToken}; refresh_token=yolo-swag`)
      .expect(
        "Set-Cookie",
        "access_token=yolo-swag; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
      )
      .expect(200, {authorization: `Bearer yolo-swag`});
  });

  test("refreshes the access token when it will almost expire", async () => {
    const accessToken = await new Promise((resolve, reject) => {
      jwt.sign(
        {works: true},
        "yolo-swag",
        {expiresIn: "20s"},
        (error, accessToken) => {
          if (error) reject(error);
          else resolve(accessToken);
        },
      );
    });
    nock(API_URL)
      .post("/account/refreshAccessToken")
      .reply(
        200,
        (_url, body) => ({
          ok: true,
          data: {accessToken: body.refreshToken},
        }),
        {"Content-Type": "application/json"},
      );
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {authorization: this.req.headers["authorization"] || null};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Cookie", `access_token=${accessToken}; refresh_token=yolo-swag`)
      .expect(
        "Set-Cookie",
        "access_token=yolo-swag; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
      )
      .expect(200, {authorization: `Bearer yolo-swag`});
  });

  test("fails the request if the refresh token request fails", async () => {
    const accessToken = await new Promise((resolve, reject) => {
      jwt.sign(
        {works: true},
        "yolo-swag",
        {expiresIn: "-1h"},
        (error, accessToken) => {
          if (error) reject(error);
          else resolve(accessToken);
        },
      );
    });
    nock(API_URL)
      .post("/account/refreshAccessToken")
      .reply(
        400,
        {ok: false, error: {code: "REFRESH_TOKEN_INVALID", extra: 42}},
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Cookie", `access_token=${accessToken}; refresh_token=yolo-swag`)
      .ok(() => true)
      .expect(
        "Set-Cookie",
        "access_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict,refresh_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict",
      )
      .expect(400, {
        ok: false,
        error: {code: "REFRESH_TOKEN_INVALID", extra: 42},
      });
  });

  test("fails gracefully if the request fails", async () => {
    await request(APIProxy)
      .get("/")
      .ok(() => true)
      .expect(404, {ok: false, error: {code: "UNKNOWN"}});
  });

  test("adds a `Forwarded` header to proxied requests", async () => {
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {forwarded: this.req.headers.forwarded};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .expect("Content-Type", "application/json")
      .expect(200)
      .then(response => {
        expect(response.body).toEqual({
          forwarded: expect.stringMatching(/^for=[^;,]+;proto=http$/),
        });
      });
  });

  test("combines a `Forwarded` header to requests that have already been proxied", async () => {
    nock(API_URL)
      .get("/")
      .reply(
        200,
        function() {
          return {forwarded: this.req.headers.forwarded};
        },
        {"Content-Type": "application/json"},
      );

    await request(APIProxy)
      .get("/")
      .set("Forwarded", "for=yolo")
      .expect("Content-Type", "application/json")
      .expect(200)
      .then(response => {
        expect(response.body).toEqual({
          forwarded: expect.stringMatching(/^for=[^;,]+;proto=http, for=yolo$/),
        });
      });
  });

  describe("/account/signIn", () => {
    test("if successful moves tokens to cookies from body", async () => {
      nock(API_URL)
        .post("/account/signIn")
        .reply(
          200,
          (_url, body) => ({
            ok: true,
            data: {accessToken: body.email, refreshToken: body.password},
          }),
          {"Content-Type": "application/json"},
        );

      await request(APIProxy)
        .post("/account/signIn")
        .send({email: "yolo", password: "swag"})
        .expect(
          "Set-Cookie",
          "access_token=yolo; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict,refresh_token=swag; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
        )
        .expect("Content-Type", "application/json")
        .expect(200, {ok: true, data: {accessToken: "", refreshToken: ""}})
        .expect(res => {
          expect(res.headers["set-cookie"]).toEqual([
            "access_token=yolo; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
            "refresh_token=swag; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
          ]);
        });
    });

    test("if failed then we proxy the body", async () => {
      nock(API_URL)
        .post("/account/signIn")
        .reply(
          400,
          {ok: false, error: {code: "SIGN_IN_INCORRECT_PASSWORD"}},
          {"Content-Type": "application/json"},
        );

      await request(APIProxy)
        .post("/account/signIn")
        .send({email: "yolo", password: "swag"})
        .ok(() => true)
        .expect("Content-Type", "application/json")
        .expect(400, {ok: false, error: {code: "SIGN_IN_INCORRECT_PASSWORD"}});
    });

    test("adds a `Forwarded` header to proxied requests", async () => {
      nock(API_URL)
        .post("/account/signIn")
        .reply(
          200,
          function() {
            return {forwarded: this.req.headers.forwarded};
          },
          {"Content-Type": "application/json"},
        );

      await request(APIProxy)
        .post("/account/signIn")
        .expect("Content-Type", "application/json")
        .expect(200)
        .then(response => {
          expect(response.body).toEqual({
            forwarded: expect.stringMatching(/^for=[^;,]+;proto=http$/),
          });
        });
    });
  });

  describe("/account/signUp", () => {
    test("if successful moves tokens to cookies from body", async () => {
      nock(API_URL)
        .post("/account/signUp")
        .reply(
          200,
          (_url, body) => ({
            ok: true,
            data: {accessToken: body.email, refreshToken: body.password},
          }),
          {"Content-Type": "application/json"},
        );

      await request(APIProxy)
        .post("/account/signUp")
        .send({email: "yolo", password: "swag"})
        .expect(
          "Set-Cookie",
          "access_token=yolo; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict,refresh_token=swag; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
        )
        .expect("Content-Type", "application/json")
        .expect(200, {ok: true, data: {accessToken: "", refreshToken: ""}})
        .expect(res => {
          expect(res.headers["set-cookie"]).toEqual([
            "access_token=yolo; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
            "refresh_token=swag; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
          ]);
        });
    });

    test("if failed then we proxy the body", async () => {
      nock(API_URL)
        .post("/account/signUp")
        .reply(
          400,
          {ok: false, error: {code: "SIGN_UP_EMAIL_ALREADY_USED"}},
          {"Content-Type": "application/json"},
        );

      await request(APIProxy)
        .post("/account/signUp")
        .send({email: "yolo", password: "swag"})
        .ok(() => true)
        .expect("Content-Type", "application/json")
        .expect(400, {ok: false, error: {code: "SIGN_UP_EMAIL_ALREADY_USED"}});
    });

    test("adds a `Forwarded` header to proxied requests", async () => {
      nock(API_URL)
        .post("/account/signUp")
        .reply(
          200,
          function() {
            return {forwarded: this.req.headers.forwarded};
          },
          {"Content-Type": "application/json"},
        );

      await request(APIProxy)
        .post("/account/signUp")
        .expect("Content-Type", "application/json")
        .expect(200)
        .then(response => {
          expect(response.body).toEqual({
            forwarded: expect.stringMatching(/^for=[^;,]+;proto=http$/),
          });
        });
    });
  });

  describe("/account/signOut", () => {
    test("will always expire the token cookies", async () => {
      await request(APIProxy)
        .post("/account/signOut")
        .send({refreshToken: ""})
        .expect("Content-Type", "application/json")
        .expect(
          "Set-Cookie",
          "access_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict,refresh_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict",
        )
        .expect(200, {ok: true, data: {}});
    });

    test("will send a refresh token cookie to the API", async () => {
      nock(API_URL)
        .post("/account/signOut")
        .reply(200, {ok: true, data: {}}, {"Content-Type": "application/json"});

      await request(APIProxy)
        .post("/account/signOut")
        .set("Cookie", "refresh_token=yolo; access_token=swag")
        .send({refreshToken: ""})
        .expect("Content-Type", "application/json")
        .expect(
          "Set-Cookie",
          "access_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict,refresh_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict",
        )
        .expect(200, {ok: true, data: {}});
    });

    test("will still clear cookies even if the API fails", async () => {
      nock(API_URL)
        .post("/account/signOut")
        .reply(
          500,
          {ok: false, error: {code: "UNKNOWN"}},
          {"Content-Type": "application/json"},
        );

      await request(APIProxy)
        .post("/account/signOut")
        .set("Cookie", "refresh_token=yolo; access_token=swag")
        .send({refreshToken: ""})
        .ok(() => true)
        .expect("Content-Type", "application/json")
        .expect(
          "Set-Cookie",
          "access_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict,refresh_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict",
        )
        .expect(500, {ok: false, error: {code: "UNKNOWN"}});
    });

    test("adds a `Forwarded` header to proxied requests", async () => {
      let forwarded;

      nock(API_URL)
        .post("/account/signOut")
        .reply(
          200,
          function() {
            forwarded = this.req.headers.forwarded;
            return {};
          },
          {"Content-Type": "application/json"},
        );

      await request(APIProxy)
        .post("/account/signOut")
        .set("Cookie", "refresh_token=yolo; access_token=swag")
        .expect(200);

      expect(forwarded).toMatch(/^for=[^;,]+;proto=http$/);
    });
  });
});

describe("WS", () => {
  const handleRequest = jest.fn((_req, res) => {
    res.statusCode = 404;
    res.end();
  });

  const upgradeServer = http.createServer(handleRequest);

  const verifyClient = jest.fn(({req}) => !!req.headers.forwarded);

  const targetServer = new WebSocket.Server({
    server: upgradeServer,
    verifyClient,
  });

  const handleConnection = jest.fn(() => {});

  targetServer.on("connection", handleConnection);

  afterEach(async () => {
    const hasClients = targetServer.clients.size !== 0;
    if (hasClients) {
      targetServer.clients.forEach(client => client.close());
      await new Promise(resolve => setTimeout(() => resolve(), 10));
    }
  });

  const proxyServer = http.createServer((_req, res) => {
    res.statusCode = 404;
    res.end();
  });

  let apiUrl;
  let proxyUrl;

  proxyServer.on("upgrade", (req, res, head) => {
    proxyUpgrade(apiUrl, req, res, head);
  });

  beforeAll(() => {
    upgradeServer.listen(0);
    proxyServer.listen(0);
    apiUrl = url.parse(`http://localhost:${upgradeServer.address().port}`);
    proxyUrl = `ws://localhost:${proxyServer.address().port}`;
  });

  test("will fail when using a POST request", async () => {
    await request(proxyServer)
      .post("/")
      .set("Connection", "Upgrade")
      .set("Upgrade", "websocket")
      .expect(400, "Bad Request");
  });

  test("will fail when using the wrong `Upgrade` header", async () => {
    await request(proxyServer)
      .get("/")
      .set("Connection", "Upgrade")
      .set("Upgrade", "yolo")
      .expect(400, "Bad Request");
  });

  test("will open a WebSocket connection", done => {
    const socket = new WebSocket(proxyUrl);

    socket.on("open", () => {
      expect(handleConnection).toBeCalledTimes(1);
      socket.close();
      done();
    });
  });

  test("will open multiple WebSocket connections", done => {
    const socket1 = new WebSocket(proxyUrl);
    const socket2 = new WebSocket(proxyUrl);
    const socket3 = new WebSocket(proxyUrl);

    socket1.on("open", handleOpen);
    socket2.on("open", handleOpen);
    socket3.on("open", handleOpen);

    let opens = 0;

    function handleOpen() {
      opens++;
      expect(opens).toBeLessThanOrEqual(3);
      if (opens === 3) {
        expect(handleConnection).toBeCalledTimes(3);
        socket1.close();
        socket2.close();
        socket3.close();
        done();
      }
    }
  });

  test("will send WebSocket messages", done => {
    const socket = new WebSocket(proxyUrl);

    handleConnection.mockImplementationOnce(socket => {
      socket.on("message", message => {
        expect(message).toEqual("yolo");
        socket.close();
        done();
      });
    });

    socket.on("open", () => {
      socket.send("yolo");
    });
  });

  test("will receive WebSocket messages", done => {
    const socket = new WebSocket(proxyUrl);

    handleConnection.mockImplementationOnce(socket => {
      socket.send("yolo");
    });

    socket.on("message", message => {
      expect(message).toEqual("yolo");
      socket.close();
      done();
    });
  });

  test("will handle an unauthorized connection error", done => {
    verifyClient.mockImplementationOnce(() => false);

    const socket = new WebSocket(proxyUrl);

    socket.on("unexpected-response", (_req, res) => {
      let data = "";

      res.on("data", buffer => {
        data += buffer.toString("utf8");
      });

      res.on("end", () => {
        expect(res.statusCode).toEqual(401);
        expect(data).toEqual("Unauthorized");
        done();
      });
    });
  });

  test("will handle an unauthorized connection and close after headers", done => {
    verifyClient.mockImplementationOnce(() => false);

    const socket = new WebSocket(proxyUrl);

    socket.on("unexpected-response", req => {
      req.end();
      done();
    });
  });

  test("adds an access token query when there is a corresponding cookie", done => {
    jwt.sign({works: true}, "yolo-swag", (error, accessToken) => {
      if (error) return done(error);

      const socket = new WebSocket(proxyUrl, {
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
      });

      socket.on("upgrade", res => {
        expect(res.headers["set-cookie"]).toEqual(undefined);
        next();
      });

      handleConnection.mockImplementationOnce((_socket, req) => {
        expect(req.url).toEqual(`/?access_token=${accessToken}`);
        next();
      });

      let count = 2;
      function next() {
        count--;
        if (count === 0) {
          socket.on("open", () => {
            socket.close();
          });
          done();
        } else if (count < 0) {
          done(new Error("Called next() too many times."));
        }
      }
    });
  });

  test("adds an access token query when there is a corresponding non-expired access token cookie", done => {
    jwt.sign(
      {works: true},
      "yolo-swag",
      {expiresIn: "1h"},
      (error, accessToken) => {
        if (error) return done(error);

        const socket = new WebSocket(proxyUrl, {
          headers: {
            Cookie: `access_token=${accessToken}`,
          },
        });

        socket.on("upgrade", res => {
          expect(res.headers["set-cookie"]).toEqual(undefined);
          next();
        });

        handleConnection.mockImplementationOnce((_socket, req) => {
          expect(req.url).toEqual(`/?access_token=${accessToken}`);
          next();
        });

        let count = 2;
        function next() {
          count--;
          if (count === 0) {
            socket.on("open", () => {
              socket.close();
            });
            done();
          } else if (count < 0) {
            done(new Error("Called next() too many times."));
          }
        }
      },
    );
  });

  test("adds an access token query when there is a corresponding non-expired access token cookie that expires soon", done => {
    jwt.sign(
      {works: true},
      "yolo-swag",
      {expiresIn: "40s"},
      (error, accessToken) => {
        if (error) return done(error);

        const socket = new WebSocket(proxyUrl, {
          headers: {
            Cookie: `access_token=${accessToken}`,
          },
        });

        socket.on("upgrade", res => {
          expect(res.headers["set-cookie"]).toEqual(undefined);
          next();
        });

        handleConnection.mockImplementationOnce((_socket, req) => {
          expect(req.url).toEqual(`/?access_token=${accessToken}`);
          next();
        });

        let count = 2;
        function next() {
          count--;
          if (count === 0) {
            socket.on("open", () => {
              socket.close();
            });
            done();
          } else if (count < 0) {
            done(new Error("Called next() too many times."));
          }
        }
      },
    );
  });

  test("an expired access token attempts to refresh its access token", done => {
    jwt.sign(
      {works: true},
      "yolo-swag",
      {expiresIn: "-1h"},
      (error, accessToken) => {
        if (error) return done(error);

        handleRequest.mockImplementationOnce((req, res) => {
          if (req.url === "/account/refreshAccessToken") {
            let data = "";
            req.on("data", buffer => (data += buffer.toString("utf8")));
            req.on("end", () => {
              expect(data).toEqual(JSON.stringify({refreshToken: "yoyoyo"}));
              res.statusCode = 400;
              res.end();
            });
          } else {
            res.statusCode = 404;
            res.end();
          }
        });

        const socket = new WebSocket(proxyUrl, {
          headers: {
            Cookie: `refresh_token=yoyoyo; access_token=${accessToken}`,
          },
        });

        socket.on("unexpected-response", (_req, res) => {
          let data = "";
          res.on("data", buffer => (data += buffer.toString("utf8")));
          res.on("end", () => {
            expect(res.statusCode).toEqual(400);
            expect(res.headers["set-cookie"]).toEqual([
              "access_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict",
              "refresh_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict",
            ]);
            expect(data).toEqual("Bad Request");
            done();
          });
        });
      },
    );
  });

  test("refreshes the access token when it has expired", done => {
    jwt.sign(
      {works: true},
      "yolo-swag",
      {expiresIn: "-1h"},
      (error, accessToken) => {
        if (error) return done(error);

        handleRequest.mockImplementationOnce((req, res) => {
          if (req.url === "/account/refreshAccessToken") {
            let data = "";
            req.on("data", buffer => (data += buffer.toString("utf8")));
            req.on("end", () => {
              res.statusCode = 200;
              res.write(
                JSON.stringify({
                  ok: true,
                  data: {accessToken: JSON.parse(data).refreshToken},
                }),
              );
              res.end();
            });
          } else {
            res.statusCode = 404;
            res.end();
          }
        });

        const socket = new WebSocket(proxyUrl, {
          headers: {
            Cookie: `refresh_token=yoyoyo; access_token=${accessToken}`,
          },
        });

        socket.on("upgrade", res => {
          expect(res.headers["set-cookie"]).toEqual([
            "access_token=yoyoyo; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
          ]);
          next();
        });

        handleConnection.mockImplementationOnce((_socket, req) => {
          expect(req.url).toEqual(`/?access_token=yoyoyo`);
          next();
        });

        let count = 2;
        function next() {
          count--;
          if (count === 0) {
            socket.on("open", () => {
              socket.close();
            });
            done();
          } else if (count < 0) {
            done(new Error("Called next() too many times."));
          }
        }
      },
    );
  });

  test("refreshes the access token when it has just expired", done => {
    jwt.sign(
      {works: true},
      "yolo-swag",
      {expiresIn: "0"},
      (error, accessToken) => {
        if (error) return done(error);

        handleRequest.mockImplementationOnce((req, res) => {
          if (req.url === "/account/refreshAccessToken") {
            let data = "";
            req.on("data", buffer => (data += buffer.toString("utf8")));
            req.on("end", () => {
              res.statusCode = 200;
              res.write(
                JSON.stringify({
                  ok: true,
                  data: {accessToken: JSON.parse(data).refreshToken},
                }),
              );
              res.end();
            });
          } else {
            res.statusCode = 404;
            res.end();
          }
        });

        const socket = new WebSocket(proxyUrl, {
          headers: {
            Cookie: `refresh_token=yoyoyo; access_token=${accessToken}`,
          },
        });

        socket.on("upgrade", res => {
          expect(res.headers["set-cookie"]).toEqual([
            "access_token=yoyoyo; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
          ]);
          next();
        });

        handleConnection.mockImplementationOnce((_socket, req) => {
          expect(req.url).toEqual(`/?access_token=yoyoyo`);
          next();
        });

        let count = 2;
        function next() {
          count--;
          if (count === 0) {
            socket.on("open", () => {
              socket.close();
            });
            done();
          } else if (count < 0) {
            done(new Error("Called next() too many times."));
          }
        }
      },
    );
  });

  test("refreshes the access token when it will almost expire", done => {
    jwt.sign(
      {works: true},
      "yolo-swag",
      {expiresIn: "20s"},
      (error, accessToken) => {
        if (error) return done(error);

        handleRequest.mockImplementationOnce((req, res) => {
          if (req.url === "/account/refreshAccessToken") {
            let data = "";
            req.on("data", buffer => (data += buffer.toString("utf8")));
            req.on("end", () => {
              res.statusCode = 200;
              res.write(
                JSON.stringify({
                  ok: true,
                  data: {accessToken: JSON.parse(data).refreshToken},
                }),
              );
              res.end();
            });
          } else {
            res.statusCode = 404;
            res.end();
          }
        });

        const socket = new WebSocket(proxyUrl, {
          headers: {
            Cookie: `refresh_token=yoyoyo; access_token=${accessToken}`,
          },
        });

        socket.on("upgrade", res => {
          expect(res.headers["set-cookie"]).toEqual([
            "access_token=yoyoyo; Max-Age=3153600000; Path=/api; HttpOnly; Secure; SameSite=Strict",
          ]);
          next();
        });

        handleConnection.mockImplementationOnce((_socket, req) => {
          expect(req.url).toEqual(`/?access_token=yoyoyo`);
          next();
        });

        let count = 2;
        function next() {
          count--;
          if (count === 0) {
            socket.on("open", () => {
              socket.close();
            });
            done();
          } else if (count < 0) {
            done(new Error("Called next() too many times."));
          }
        }
      },
    );
  });

  test("an expired access token attempts to refresh its access token", done => {
    jwt.sign(
      {works: true},
      "yolo-swag",
      {expiresIn: "-1h"},
      (error, accessToken) => {
        if (error) return done(error);

        handleRequest.mockImplementationOnce((req, res) => {
          if (req.url === "/account/refreshAccessToken") {
            let data = "";
            req.on("data", buffer => (data += buffer.toString("utf8")));
            req.on("end", () => {
              expect(data).toEqual(JSON.stringify({refreshToken: "yoyoyo"}));
              res.statusCode = 400;
              res.write(
                JSON.stringify({
                  ok: false,
                  error: {code: "REFRESH_TOKEN_INVALID", extra: 42},
                }),
              );
              res.end();
            });
          } else {
            res.statusCode = 404;
            res.end();
          }
        });

        const socket = new WebSocket(proxyUrl, {
          headers: {
            Cookie: `refresh_token=yoyoyo; access_token=${accessToken}`,
          },
        });

        socket.on("unexpected-response", (_req, res) => {
          let data = "";
          res.on("data", buffer => (data += buffer.toString("utf8")));
          res.on("end", () => {
            expect(res.statusCode).toEqual(400);
            expect(res.headers["set-cookie"]).toEqual([
              "access_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict",
              "refresh_token=; Max-Age=0; Path=/api; HttpOnly; Secure; SameSite=Strict",
            ]);
            expect(data).toEqual("Bad Request");
            done();
          });
        });
      },
    );
  });
});
