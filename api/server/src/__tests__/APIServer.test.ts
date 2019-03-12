/* eslint-disable import/first */

jest.mock("../PGContext", () => ({PGContext: {get: () => ({})}}));
jest.mock("../PGClient", () => ({
  PGClient: {with: (action: any) => action({})},
}));
jest.mock("../methods", () => ({
  account: {
    signIn: jest.fn(() => ({works: true})),
    getCurrentAccountProfile: jest.fn((_, accountID) => ({
      works: true,
      accountID,
    })),
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
const getCurrentAccountProfile: jest.Mock<
  typeof methods.account.signIn
> = methods.account.getCurrentAccountProfile as any;

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

test("GET /account/getCurrentAccountProfile", async () => {
  await request(APIServer)
    .get("/account/getCurrentAccountProfile")
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(404, {
      ok: false,
      error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
    });
  expect(getCurrentAccountProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccountProfile - without authorization", async () => {
  await request(APIServer)
    .post("/account/getCurrentAccountProfile")
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentAccountProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccountProfile - incorrect authorization header", async () => {
  await request(APIServer)
    .post("/account/getCurrentAccountProfile")
    .set("Authorization", "Bear foobar")
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentAccountProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccountProfile - malformed JWT", async () => {
  await request(APIServer)
    .post("/account/getCurrentAccountProfile")
    .set("Authorization", "Bearer foobar")
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentAccountProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccountProfile - bad signature JWT", async () => {
  const accessToken = jwt.sign({id: 42}, "secret-secret-cats");
  await request(APIServer)
    .post("/account/getCurrentAccountProfile")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.UNAUTHORIZED},
    });
  expect(getCurrentAccountProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccountProfile - expired JWT", async () => {
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "-1d"});
  await request(APIServer)
    .post("/account/getCurrentAccountProfile")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({})
    .ok(() => true)
    .expect("Content-Type", /json/)
    .expect(401, {
      ok: false,
      error: {code: APIErrorCode.ACCESS_TOKEN_EXPIRED},
    });
  expect(getCurrentAccountProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentAccountProfile", async () => {
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "1d"});
  await request(APIServer)
    .post("/account/getCurrentAccountProfile")
    .set("Authorization", `Bearer ${accessToken}`)
    .send({})
    .expect("Content-Type", /json/)
    .expect(200, {
      ok: true,
      data: {works: true, accountID: 42},
    });
  expect(getCurrentAccountProfile).toHaveBeenCalledTimes(1);
});
