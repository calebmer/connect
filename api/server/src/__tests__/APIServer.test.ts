/* eslint-disable import/first */

jest.mock("../PGContext", () => ({PGContext: {get: () => ({})}}));
jest.mock("../PGClient", () => ({
  PGClient: {with: (action: any) => action({})},
}));
jest.mock("../methods", () => ({
  account: {
    signIn: jest.fn(() => ({works: true})),
    getCurrentAccount: jest.fn((_, accountID) => ({works: true, accountID})),
  },
}));

import * as methods from "../methods";
import {APIErrorCode} from "@connect/api-client";
import {APIServer} from "../APIServer";
import {JWT_SECRET} from "../RunConfig";
import jwt from "jsonwebtoken";
import request from "supertest";

const signIn: jest.Mock<typeof methods.account.signIn> = methods.account
  .signIn as any;
const getCurrentAccount: jest.Mock<typeof methods.account.signIn> = methods
  .account.getCurrentAccount as any;

test("GET /", async () => {
  await request(APIServer)
    .get("/")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(404, {
      ok: false,
      error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
    });
});

test("GET /account", async () => {
  await request(APIServer)
    .get("/account")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(404, {
      ok: false,
      error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
    });
});

test("GET /account/signIn", async () => {
  await request(APIServer)
    .get("/account/signIn")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(404, {
      ok: false,
      error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - without input", async () => {
  await request(APIServer)
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
  await request(APIServer)
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
  await request(APIServer)
    .post("/account/signIn")
    .type("json")
    .send("(nope)")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(400, {
      ok: false,
      error: {code: APIErrorCode.UNKNOWN},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with string input", async () => {
  await request(APIServer)
    .post("/account/signIn")
    .type("json")
    .send('"nope"')
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(400, {
      ok: false,
      error: {code: APIErrorCode.UNKNOWN},
    });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with incorrect input", async () => {
  await request(APIServer)
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
  await request(APIServer)
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
  await request(APIServer)
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
  await request(APIServer)
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
  await request(APIServer)
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

test("GET /account/getCurrentAccount", async () => {
  await request(APIServer)
    .get("/account/getCurrentAccount")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(404, {
      ok: false,
      error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
    });
  expect(getCurrentAccount).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccount - without authorization", async () => {
  await request(APIServer)
    .post("/account/getCurrentAccount")
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentAccount).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccount - incorrect authorization header", async () => {
  await request(APIServer)
    .post("/account/getCurrentAccount")
    .set("Authorization", "Bear foobar")
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentAccount).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccount - malformed JWT", async () => {
  await request(APIServer)
    .post("/account/getCurrentAccount")
    .set("Authorization", "Bearer foobar")
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentAccount).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccount - bad signature JWT", async () => {
  const accessToken = jwt.sign({id: 42}, "secret-secret-cats");
  await request(APIServer)
    .post("/account/getCurrentAccount")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentAccount).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccount - expired JWT", async () => {
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "-1d"});
  await request(APIServer)
    .post("/account/getCurrentAccount")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.ACCESS_TOKEN_EXPIRED},
    });
  expect(getCurrentAccount).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccount", async () => {
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "1d"});
  await request(APIServer)
    .post("/account/getCurrentAccount")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({})
    .expect("Content-Type", /json/)
    .expect(200, {
      ok: true,
      data: {works: true, accountID: 42},
    });
  expect(getCurrentAccount).toHaveBeenCalledTimes(1);
});
