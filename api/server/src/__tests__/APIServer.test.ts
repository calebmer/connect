/* eslint-disable import/first */

jest.mock("../PGClient", () => ({
  PGClient: {with: (action: any) => action({query: () => {}})},
}));
jest.mock("../methods");

import * as methods from "../methods";
import {APIErrorCode, generateID} from "@connect/api-client";
import {APIServer, APIServerWS, detectBrokenConnections} from "../APIServer";
import {JWT_SECRET} from "../RunConfig";
import WebSocket from "ws";
import getPort from "get-port";
import jwt from "jsonwebtoken";
import request from "supertest";

const signIn: jest.Mock<typeof methods.account.signIn> = methods.account
  .signIn as any;
const getCurrentProfile: jest.Mock<typeof methods.account.signIn> = methods
  .account.getCurrentProfile as any;
const getManyProfiles: jest.Mock<
  typeof methods.account.getManyProfiles
> = methods.account.getManyProfiles as any;
const watchPostComments: jest.Mock<
  typeof methods.comment.watchPostComments
> = methods.comment.watchPostComments as any;

(signIn as any).mockImplementation(async () => {
  return {works: true};
});

(getCurrentProfile as any).mockImplementation(async (ctx: any) => {
  return {
    works: true,
    accountID: ctx.accountID,
  };
});

(getManyProfiles as any).mockImplementation(async () => {
  return {works: true};
});

const watchPostCommentsUnsubscribe = jest.fn(async () => {});

(watchPostComments as any).mockImplementation(async () => {
  return watchPostCommentsUnsubscribe;
});

// Have the server start listening for requests on a randomly selected port
// before we run any tests!
beforeAll(async () => {
  const port = await getPort();
  await new Promise(resolve => {
    APIServer.listen(port, () => {
      resolve();
    });
  });
});

// Close the server after all our tests complete.
afterAll(async () => {
  await new Promise((resolve, reject) => {
    APIServer.close(error => {
      if (error) reject(error);
      else resolve();
    });
  });
});

describe("HTTP", () => {
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
      .expect(405, {
        ok: false,
        error: {code: APIErrorCode.BAD_INPUT},
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
        error: {code: APIErrorCode.BAD_INPUT},
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
        error: {code: APIErrorCode.BAD_INPUT},
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

  test("POST /account/getCurrentProfile", async () => {
    await request(APIServer)
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
    await request(APIServer)
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
    await request(APIServer)
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
    await request(APIServer)
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
    await request(APIServer)
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
    await request(APIServer)
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
    await request(APIServer)
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
    await request(APIServer)
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
    await request(APIServer)
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
    await request(APIServer)
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
    await request(APIServer)
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
});

describe("WS", () => {
  function createWebSocketClient(done: jest.DoneCallback): WebSocket {
    const port = (APIServer.address() as any).port;
    const socket = new WebSocket(`ws://localhost:${port}`);

    // When an error occurs, implicitly call our “done” callback with an error.
    socket.on("error", error => {
      done(error);
    });

    // We will cleanup open sockets after each test.
    openSockets.push(socket);

    return socket;
  }

  const openSockets: Array<WebSocket> = [];

  // Make sure to close all the sockets that we opened after each test. We wait
  // a bit after closing to make sure all the asynchronous work that happens
  // after closing truly runs.
  afterEach(async () => {
    openSockets.forEach(socket => socket.close());
    openSockets.length = 0;
    await new Promise(resolve => setTimeout(() => resolve(), 10));
  });

  test("will accept a web socket connection", done => {
    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      done();
    });
  });

  test("will ping the client at some interval", done => {
    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      detectBrokenConnections();
    });

    let first = true;

    socket.on("ping", () => {
      if (first) {
        first = false;
        // Wait for the pong to send...
        setTimeout(() => {
          detectBrokenConnections();
        }, 10);
      } else {
        done();
      }
    });
  });

  test("will clean up broken connections that don’t respond to pings", done => {
    const socket = createWebSocketClient(done);

    // Break socket by making it unable to pong.
    socket.pong = () => {};

    socket.on("open", () => {
      expect(APIServerWS.clients.size).toEqual(1);
      detectBrokenConnections();
      expect(APIServerWS.clients.size).toEqual(1);
      setTimeout(() => {
        expect(APIServerWS.clients.size).toEqual(1);
        detectBrokenConnections();
        setTimeout(() => {
          expect(APIServerWS.clients.size).toEqual(0);
          done();
        }, 10);
      }, 10);
    });
  });

  test("will not accept binary data", done => {
    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]));
    });

    socket.on("message", message => {
      expect(JSON.parse(message as string)).toEqual({
        type: "error",
        error: {code: APIErrorCode.BAD_INPUT},
      });
      done();
    });
  });

  test("will not non-JSON data", done => {
    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send("test");
    });

    socket.on("message", message => {
      expect(JSON.parse(message as string)).toEqual({
        type: "error",
        error: {code: APIErrorCode.BAD_INPUT},
      });
      done();
    });
  });

  test("will not accept objects that are not in the right message format", done => {
    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(JSON.stringify({type: "nope"}));
    });

    socket.on("message", message => {
      expect(JSON.parse(message as string)).toEqual({
        type: "error",
        error: {code: APIErrorCode.BAD_INPUT},
      });
      done();
    });
  });

  test("will error for not found subscription routes", done => {
    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/nope",
          input: {},
        }),
      );
    });

    socket.on("message", message => {
      expect(JSON.parse(message as string)).toEqual({
        type: "error",
        error: {code: APIErrorCode.NOT_FOUND},
      });
      done();
    });
  });

  test("will error for incorrectly formatted subscription input", done => {
    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: 42,
        }),
      );
    });

    socket.on("message", message => {
      expect(JSON.parse(message as string)).toEqual({
        type: "error",
        error: {code: APIErrorCode.BAD_INPUT},
      });
      done();
    });
  });

  test("will subscribe to a subscription defined in our schema", done => {
    const postID = generateID();

    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      expect(watchPostComments).toHaveBeenCalledTimes(0);
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID},
        }),
      );
      setTimeout(() => {
        expect(watchPostComments).toHaveBeenCalledTimes(1);
        expect(watchPostComments).toHaveBeenCalledWith(expect.anything(), {
          postID,
        });
        done();
      }, 10);
    });
  });

  test("will subscribe and receive a message from a subscription", done => {
    const subscriptionID = generateID();
    const postID = generateID();

    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      expect(watchPostComments).toHaveBeenCalledTimes(0);
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: subscriptionID,
          path: "/comment/watchPostComments",
          input: {postID},
        }),
      );
      setTimeout(() => {
        expect(watchPostComments).toHaveBeenCalledTimes(1);
        watchPostComments.mock.calls[0][0].publish({works: true});
      }, 10);
    });

    socket.on("message", message => {
      expect(JSON.parse(message as string)).toEqual({
        type: "message",
        id: subscriptionID,
        message: {works: true},
      });
      done();
    });
  });

  test("will subscribe and receive multiple messages from a subscription", done => {
    const subscriptionID = generateID();
    const postID = generateID();

    let actual = 0;
    let expected = 0;

    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      expect(watchPostComments).toHaveBeenCalledTimes(0);
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: subscriptionID,
          path: "/comment/watchPostComments",
          input: {postID},
        }),
      );
      setTimeout(() => {
        expect(watchPostComments).toHaveBeenCalledTimes(1);
        const ctx = watchPostComments.mock.calls[0][0];
        ctx.publish({value: actual++});
        ctx.publish({value: actual++});
        ctx.publish({value: actual++});
      }, 10);
    });

    socket.on("message", message => {
      expect(JSON.parse(message as string)).toEqual({
        type: "message",
        id: subscriptionID,
        message: {value: expected++},
      });
      expect(expected).toBeLessThanOrEqual(3);
      if (expected === 3) {
        done();
      }
    });
  });

  test("will error when trying to subscribe while using the same ID", done => {
    const subscriptionID = generateID();

    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: subscriptionID,
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: subscriptionID,
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
    });

    socket.on("message", message => {
      expect(JSON.parse(message as string)).toEqual({
        type: "error",
        error: {code: APIErrorCode.ALREADY_EXISTS},
      });
      done();
    });
  }, 2000);

  test("will unsubscribe when the socket closes", done => {
    const subscriptionID = generateID();
    const postID = generateID();

    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: subscriptionID,
          path: "/comment/watchPostComments",
          input: {postID},
        }),
      );
      setTimeout(() => {
        expect(watchPostComments).toHaveBeenCalledTimes(1);
        expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(0);
        socket.close();
        setTimeout(() => {
          expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(1);
          done();
        }, 10);
      }, 10);
    });
  });

  test("will unsubscribe from everything when the socket closes", done => {
    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      setTimeout(() => {
        expect(watchPostComments).toHaveBeenCalledTimes(3);
        expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(0);
        socket.close();
        setTimeout(() => {
          expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(3);
          done();
        }, 10);
      }, 10);
    });
  });

  test("will error if trying to unsubscribe from a subscription that does not exist", done => {
    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "unsubscribe",
          id: generateID(),
        }),
      );
    });

    socket.on("message", message => {
      expect(JSON.parse(message as string)).toEqual({
        type: "error",
        error: {code: APIErrorCode.NOT_FOUND},
      });
      done();
    });
  });

  test("will error if trying to unsubscribe from a subscription when some exist", done => {
    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      socket.send(
        JSON.stringify({
          type: "unsubscribe",
          id: generateID(),
        }),
      );
    });

    socket.on("message", message => {
      expect(JSON.parse(message as string)).toEqual({
        type: "error",
        error: {code: APIErrorCode.NOT_FOUND},
      });
      done();
    });
  });

  test("will unsubscribe with an unsubscribe message", done => {
    const subscriptionID = generateID();

    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: subscriptionID,
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      setTimeout(() => {
        expect(watchPostComments).toHaveBeenCalledTimes(1);
        expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(0);
        socket.send(
          JSON.stringify({
            type: "unsubscribe",
            id: subscriptionID,
          }),
        );
        setTimeout(() => {
          expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(1);
          done();
        }, 10);
      }, 10);
    });
  });

  test("will unsubscribe with an unsubscribe message when there are many subscriptions", done => {
    const subscriptionID = generateID();

    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: subscriptionID,
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      setTimeout(() => {
        expect(watchPostComments).toHaveBeenCalledTimes(3);
        expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(0);
        socket.send(
          JSON.stringify({
            type: "unsubscribe",
            id: subscriptionID,
          }),
        );
        setTimeout(() => {
          expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(1);
          done();
        }, 10);
      }, 10);
    });
  });

  test("will unsubscribe with an unsubscribe message and unsubscribes from the rest when closing", done => {
    const subscriptionID = generateID();

    const socket = createWebSocketClient(done);

    socket.on("open", () => {
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: subscriptionID,
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      socket.send(
        JSON.stringify({
          type: "subscribe",
          id: generateID(),
          path: "/comment/watchPostComments",
          input: {postID: generateID()},
        }),
      );
      setTimeout(() => {
        expect(watchPostComments).toHaveBeenCalledTimes(3);
        expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(0);
        socket.send(
          JSON.stringify({
            type: "unsubscribe",
            id: subscriptionID,
          }),
        );
        setTimeout(() => {
          expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(1);
          socket.close();
          setTimeout(() => {
            expect(watchPostCommentsUnsubscribe).toHaveBeenCalledTimes(3);
            done();
          }, 10);
        }, 10);
      }, 10);
    });
  });
});
