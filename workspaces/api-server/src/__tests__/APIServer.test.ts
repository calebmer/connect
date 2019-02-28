/* eslint-disable import/first */

const signIn = jest.fn((_ctx, _input) => Promise.resolve({works: true}));
jest.mock("../methods", () => ({account: {signIn}}));

import {Server} from "http";
import fetch from "node-fetch";
import {APIErrorCode} from "@connect/api-client";
import {APIServer} from "../APIServer";

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
    ["etag", expect.anything()],
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
    ["etag", expect.anything()],
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
    ["etag", expect.anything()],
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
    ["etag", expect.anything()],
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
    ["etag", expect.anything()],
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
    ["etag", expect.anything()],
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
    ["etag", expect.anything()],
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
    ["etag", expect.anything()],
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
    ["etag", expect.anything()],
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
    ["etag", expect.anything()],
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
    ["etag", expect.anything()],
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
