import {APIErrorCode, APISchema} from "@connect/api-client";
import {
  initializeServerMethod,
  initializeServerMethodUnauthorized,
  initializeServerMiddlewareAfter,
  initializeServerMiddlewareBefore,
} from "../ServerHTTP";
import {JWT_SECRET} from "../RunConfig";
import express from "express";
import getPort from "get-port";
import http from "http";
import jwt from "jsonwebtoken";
import supertest from "supertest";

const signIn = jest.fn(
  async (_ctx: any, _input: any): Promise<any> => {
    return {works: true};
  },
);

const getCurrentProfile = jest.fn(
  async (ctx: any, _input: any): Promise<any> => {
    return {
      works: true,
      accountID: ctx.accountID,
    };
  },
);

const getManyProfiles = jest.fn(
  async (_ctx: any, _input: any): Promise<any> => {
    return {works: true};
  },
);

const serverHTTP = express();
const server = http.createServer(serverHTTP);

initializeServerMiddlewareBefore(serverHTTP);

initializeServerMethodUnauthorized(
  serverHTTP,
  ["account", "signIn"],
  signIn,
  APISchema.schemas.account.schemas.signIn,
);

initializeServerMethod(
  serverHTTP,
  ["account", "getCurrentProfile"],
  getCurrentProfile,
  APISchema.schemas.account.schemas.getCurrentProfile,
);

initializeServerMethod(
  serverHTTP,
  ["account", "getManyProfiles"],
  getManyProfiles,
  APISchema.schemas.account.schemas.getManyProfiles,
);

initializeServerMiddlewareAfter(serverHTTP);

const request = supertest(server);

// Have the server start listening for requests on a randomly selected port
// before we run any tests!
beforeAll(async () => {
  const port = await getPort();
  await new Promise(resolve => {
    server.listen(port, () => {
      resolve();
    });
  });
});

// Close the server after all our tests complete.
afterAll(async () => {
  await new Promise((resolve, reject) => {
    server.close(error => {
      if (error) reject(error);
      else resolve();
    });
  });
});

test("GET /", async () => {
  await request
    .get("/")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(404, {
      ok: false,
      error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
    });
});

test("GET /account", async () => {
  await request
    .get("/account")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(404, {
      ok: false,
      error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
    });
});

test("GET /account/signIn", async () => {
  await request
    .get("/account/signIn")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(405, {
      ok: false,
      error: {code: APIErrorCode.BAD_INPUT},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - without input", async () => {
  await request
    .post("/account/signIn")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(400, {
      ok: false,
      error: {code: APIErrorCode.BAD_INPUT},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with non-JSON input", async () => {
  await request
    .post("/account/signIn")
    .set("Content-Type", "text/plain")
    .send("(nope)")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(400, {
      ok: false,
      error: {code: APIErrorCode.BAD_INPUT},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with invalid JSON input", async () => {
  await request
    .post("/account/signIn")
    .type("json")
    .send("(nope)")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(400, {
      ok: false,
      error: {code: APIErrorCode.BAD_INPUT},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with string input", async () => {
  await request
    .post("/account/signIn")
    .type("json")
    .send('"nope"')
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(400, {
      ok: false,
      error: {code: APIErrorCode.BAD_INPUT},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with incorrect input", async () => {
  await request
    .post("/account/signIn")
    .send({a: 1, b: 2})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(400, {
      ok: false,
      error: {code: APIErrorCode.BAD_INPUT},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with semi-incorrect input, missing key", async () => {
  await request
    .post("/account/signIn")
    .send({email: "hello@example.com"})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(400, {
      ok: false,
      error: {code: APIErrorCode.BAD_INPUT},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with semi-incorrect input, wrong type", async () => {
  await request
    .post("/account/signIn")
    .send({email: "hello@example.com", password: 42})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(400, {
      ok: false,
      error: {code: APIErrorCode.BAD_INPUT},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn", async () => {
  await request
    .post("/account/signIn")
    .send({email: "hello@example.com", password: "qwerty"})
    .expect("Content-Type", /json/)
    .expect(200, {
      ok: true,
      data: {works: true},
    });
  expect(signIn.mock.calls.length).toBe(1);
  expect(signIn.mock.calls[0][1]).toEqual({
    email: "hello@example.com",
    password: "qwerty",
  });
});

test("POST /account/signIn - with extra input", async () => {
  await request
    .post("/account/signIn")
    .send({email: "hello@example.com", password: "qwerty", extra: 42})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(400, {
      ok: false,
      error: {code: APIErrorCode.BAD_INPUT},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/getCurrentProfile", async () => {
  await request
    .post("/account/getCurrentProfile")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(405, {
      ok: false,
      error: {code: APIErrorCode.BAD_INPUT},
    });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("GET /account/getCurrentProfile - without authorization", async () => {
  await request
    .get("/account/getCurrentProfile")
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("GET /account/getCurrentProfile - incorrect authorization header", async () => {
  await request
    .get("/account/getCurrentProfile")
    .set("Authorization", "Bear foobar")
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("GET /account/getCurrentProfile - malformed JWT", async () => {
  await request
    .get("/account/getCurrentProfile")
    .set("Authorization", "Bearer foobar")
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("GET /account/getCurrentProfile - bad signature JWT", async () => {
  const accessToken = jwt.sign({id: 42}, "secret-secret-cats");
  await request
    .get("/account/getCurrentProfile")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("GET /account/getCurrentProfile - expired JWT", async () => {
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "-1d"});
  await request
    .get("/account/getCurrentProfile")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.ACCESS_TOKEN_EXPIRED},
    });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("GET /account/getCurrentProfile", async () => {
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "1d"});
  await request
    .get("/account/getCurrentProfile")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({})
    .expect("Content-Type", /json/)
    .expect(200, {
      ok: true,
      data: {works: true, accountID: 42},
    });
  expect(getCurrentProfile).toHaveBeenCalledTimes(1);
});

test("GET /account/getCurrentProfile - without input", async () => {
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "1d"});
  await request
    .get("/account/getCurrentProfile")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect("Content-Type", /json/)
    .expect(200, {
      ok: true,
      data: {works: true, accountID: 42},
    });
  expect(getCurrentProfile).toHaveBeenCalledTimes(1);
});

test("GET /account/getManyProfiles - with many ids", async () => {
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "1d"});
  await request
    .get("/account/getManyProfiles")
    .query("ids=1&ids=2&ids=3")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect("Content-Type", /json/)
    .expect(200, {
      ok: true,
      data: {works: true},
    });
  expect(getManyProfiles).toHaveBeenCalledTimes(1);
  expect(getManyProfiles).toHaveBeenCalledWith(expect.anything(), {
    ids: [1, 2, 3],
  });
});

test("GET /account/getManyProfiles - with one id", async () => {
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "1d"});
  await request
    .get("/account/getManyProfiles")
    .query("ids=1")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect("Content-Type", /json/)
    .expect(200, {
      ok: true,
      data: {works: true},
    });
  expect(getManyProfiles).toHaveBeenCalledTimes(1);
  expect(getManyProfiles).toHaveBeenCalledWith(expect.anything(), {ids: [1]});
});

test("GET /account/getManyProfiles - with no ids", async () => {
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "1d"});
  await request
    .get("/account/getManyProfiles")
    .set("Authorization", `Bearer ${accessToken}`)
    .expect("Content-Type", /json/)
    .expect(200, {
      ok: true,
      data: {works: true},
    });
  expect(getManyProfiles).toHaveBeenCalledTimes(1);
  expect(getManyProfiles).toHaveBeenCalledWith(expect.anything(), {ids: []});
});
