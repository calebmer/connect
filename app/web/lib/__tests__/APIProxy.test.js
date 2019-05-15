const url = require("url");
const http = require("http");
const jwt = require("jsonwebtoken");
const nock = require("nock");
const request = require("supertest");
const {proxyRequest} = require("../APIProxy");
const {API_URL} = require("../RunConfig");

describe("HTTP", () => {
  const APIProxy = http.createServer((req, res) => {
    proxyRequest(req, res, url.parse(req.url).pathname);
  });

  APIProxy.listen(0);

  beforeAll(() => {
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
      .expect(500, {ok: false, error: {code: "UNKNOWN"}});
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
        .expect(200, {ok: true, data: {accessToken: "", refreshToken: ""}});
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
        .expect(200, {ok: true, data: {accessToken: "", refreshToken: ""}});
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
