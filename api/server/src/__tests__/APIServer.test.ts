/* eslint-disable import/first */

jest.mock("../methods", () => ({
  account: {
    signIn: jest.fn((_ctx, _input) => {
      return Promise.resolve({works: true});
    }),
    getCurrentProfile: jest.fn((ctx, _input) => {
      return Promise.resolve({works: true, accountID: ctx.accountID});
    }),
  },
}));

import * as methods from "../methods";
import {APIErrorCode} from "@connect/api-client";
import {APIServer} from "../APIServer";
import {JWT_SECRET} from "../RunConfig";
import {Server} from "http";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";

const signIn: jest.Mock<typeof methods.account.signIn> = methods.account
  .signIn as any;
const getCurrentProfile: jest.Mock<typeof methods.account.signIn> = methods
  .account.getCurrentProfile as any;

// We spin up the API server as an HTTP server for our tests. We use port 3594
// since we don’t expect anyone else to use it. 3593 is a prime number and then
// we add 1 to be even more uncommon.
const port = 3594;

// The url to our test server.
const url = `http://localhost:${port}`;

let server: Server;

beforeAll(() => {
  server = APIServer.listen(port);
});

afterAll(() => {
  server.close();
});

test("GET /", async () => {
  const response = await fetch(url);
  expect(response.status).toBe(404);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
  });
});

test("GET /account", async () => {
  const response = await fetch(`${url}/account`);
  expect(response.status).toBe(404);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
  });
});

test("GET /account/signIn", async () => {
  signIn.mockClear();
  const response = await fetch(`${url}/account/signIn`);
  expect(response.status).toBe(404);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
  });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - without input", async () => {
  signIn.mockClear();
  const response = await fetch(`${url}/account/signIn`, {method: "POST"});
  expect(response.status).toBe(400);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.BAD_INPUT},
  });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with non-JSON input", async () => {
  signIn.mockClear();
  const response = await fetch(`${url}/account/signIn`, {
    method: "POST",
    headers: {"content-type": "text/plain"},
    body: "(nope)",
  });
  expect(response.status).toBe(400);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.BAD_INPUT},
  });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with invalid JSON input", async () => {
  signIn.mockClear();
  const response = await fetch(`${url}/account/signIn`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: "(nope)",
  });
  expect(response.status).toBe(400);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.UNKNOWN},
  });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with string input", async () => {
  signIn.mockClear();
  const response = await fetch(`${url}/account/signIn`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify("nope"),
  });
  expect(response.status).toBe(400);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.UNKNOWN},
  });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with incorrect input", async () => {
  signIn.mockClear();
  const response = await fetch(`${url}/account/signIn`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({a: 1, b: 2}),
  });
  expect(response.status).toBe(400);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.BAD_INPUT},
  });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with semi-incorrect input, missing key", async () => {
  signIn.mockClear();
  const response = await fetch(`${url}/account/signIn`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({email: "hello@example.com"}),
  });
  expect(response.status).toBe(400);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.BAD_INPUT},
  });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn - with semi-incorrect input, wrong type", async () => {
  signIn.mockClear();
  const response = await fetch(`${url}/account/signIn`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({email: "hello@example.com", password: 42}),
  });
  expect(response.status).toBe(400);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.BAD_INPUT},
  });
  expect(signIn).not.toHaveBeenCalled();
});

test("POST /account/signIn", async () => {
  signIn.mockClear();
  const response = await fetch(`${url}/account/signIn`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({email: "hello@example.com", password: "qwerty"}),
  });
  expect(response.status).toBe(200);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
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
  signIn.mockClear();
  const response = await fetch(`${url}/account/signIn`, {
    method: "POST",
    headers: {"content-type": "application/json"},
    body: JSON.stringify({
      email: "hello@example.com",
      password: "qwerty",
      extra: 42,
    }),
  });
  expect(response.status).toBe(200);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: true,
    data: {works: true},
  });
  expect(signIn.mock.calls.length).toBe(1);
  expect(signIn.mock.calls[0][1]).toEqual({
    email: "hello@example.com",
    password: "qwerty",
    extra: 42,
  });
});

test("GET /account/getCurrentProfile", async () => {
  getCurrentProfile.mockClear();
  const response = await fetch(`${url}/account/getCurrentProfile`);
  expect(response.status).toBe(404);
  expect(Array.from(response.headers)).toEqual([
    ["connection", "close"],
    ["content-length", expect.anything()],
    ["content-type", "application/json; charset=utf-8"],
    ["date", expect.anything()],
  ]);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.UNRECOGNIZED_METHOD},
  });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentProfile - without authorization", async () => {
  getCurrentProfile.mockClear();
  const response = await fetch(`${url}/account/getCurrentProfile`, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({}),
  });
  expect(response.status).toBe(401);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.UNAUTHORIZED},
  });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentProfile - incorrect authorization header", async () => {
  getCurrentProfile.mockClear();
  const response = await fetch(`${url}/account/getCurrentProfile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bear foobar",
    },
    body: JSON.stringify({}),
  });
  expect(response.status).toBe(401);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.UNAUTHORIZED},
  });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentProfile - malformed JWT", async () => {
  getCurrentProfile.mockClear();
  const response = await fetch(`${url}/account/getCurrentProfile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer foobar",
    },
    body: JSON.stringify({}),
  });
  expect(response.status).toBe(401);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.UNAUTHORIZED},
  });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentProfile - bad signature JWT", async () => {
  getCurrentProfile.mockClear();
  const accessToken = jwt.sign({id: 42}, "secret-secret-cats");
  const response = await fetch(`${url}/account/getCurrentProfile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
  expect(response.status).toBe(401);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.UNAUTHORIZED},
  });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentProfile - expired JWT", async () => {
  getCurrentProfile.mockClear();
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "-1d"});
  const response = await fetch(`${url}/account/getCurrentProfile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
  expect(response.status).toBe(401);
  const body = await response.json();
  expect(body).toEqual({
    ok: false,
    error: {code: APIErrorCode.ACCESS_TOKEN_EXPIRED},
  });
  expect(getCurrentProfile).not.toHaveBeenCalled();
});

test("POST /account/getCurrentProfile", async () => {
  getCurrentProfile.mockClear();
  const accessToken = jwt.sign({id: 42}, JWT_SECRET, {expiresIn: "1d"});
  const response = await fetch(`${url}/account/getCurrentProfile`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({}),
  });
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body).toEqual({
    ok: true,
    data: {works: true, accountID: 42},
  });
  expect(getCurrentProfile).toHaveBeenCalledTimes(1);
});