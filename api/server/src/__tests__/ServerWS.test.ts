import {
  APIErrorCode,
  APISchema,
  AccessToken,
  AccountID,
  generateID,
} from "@connect/api-client";
import {AccessTokenData, AccessTokenGenerator} from "../AccessToken";
import {JWT_SECRET} from "../RunConfig";
import {ServerWS} from "../ServerWS";
import WebSocket from "ws";
import getPort from "get-port";
import http from "http";
import jwt from "jsonwebtoken";

const watchPostCommentsUnsubscribe = jest.fn(async () => {});

const watchPostComments = jest.fn(async (_ctx: any, _input: any) => {
  return watchPostCommentsUnsubscribe;
});

const server = http.createServer((_req, res) => {
  res.statusCode = 404;
  res.end();
});

const serverWS = ServerWS.create(server);

ServerWS.initializeSubscription(
  serverWS,
  ["comment", "watchPostComments"],
  watchPostComments,
  APISchema.schemas.comment.schemas.watchPostComments,
);

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

const accountID = 42 as AccountID;
const accessTokenData: AccessTokenData = {id: accountID};
let accessToken: AccessToken;

// Generate a default access token that we can use in our tests.
beforeAll(async () => {
  accessToken = await AccessTokenGenerator.generate(accessTokenData);
});

function createWebSocketClient(done: jest.DoneCallback): WebSocket {
  const port = (server.address() as any).port;
  const socket = new WebSocket(
    `ws://localhost:${port}?access_token=${accessToken}`,
  );

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
  openSockets.forEach(socket => {
    try {
      socket.close();
    } catch (error) {
      // ignore errors
    }
  });
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
    ServerWS.detectBrokenConnections(serverWS);
  });

  let first = true;

  socket.on("ping", () => {
    if (first) {
      first = false;
      // Wait for the pong to send...
      setTimeout(() => {
        ServerWS.detectBrokenConnections(serverWS);
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
    expect(serverWS.clients.size).toEqual(1);
    ServerWS.detectBrokenConnections(serverWS);
    expect(serverWS.clients.size).toEqual(1);
    setTimeout(() => {
      expect(serverWS.clients.size).toEqual(1);
      ServerWS.detectBrokenConnections(serverWS);
      setTimeout(() => {
        expect(serverWS.clients.size).toEqual(0);
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

test("will subscribe to a subscription with the correct authorization", done => {
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
      expect(watchPostComments.mock.calls[0][0].accountID).toEqual(accountID);
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

test("will error if no access token was provided", done => {
  const port = (server.address() as any).port;
  const socket = new WebSocket(`ws://localhost:${port}`);
  openSockets.push(socket);

  socket.on("error", error => {
    expect(error.message).toMatch("401");
    done();
  });
});

test("will error if a poorly formatted access token was provided", done => {
  const port = (server.address() as any).port;
  const socket = new WebSocket(`ws://localhost:${port}?access_token=test`);
  openSockets.push(socket);

  socket.on("error", error => {
    expect(error.message).toMatch("401");
    done();
  });
});

test("will error if an access token with the wrong signature was provided", done => {
  jwt.sign(accessTokenData, "kittens", (error, accessToken) => {
    if (error) return done(error);

    const port = (server.address() as any).port;
    const socket = new WebSocket(
      `ws://localhost:${port}?access_token=${accessToken}`,
    );
    openSockets.push(socket);

    socket.on("error", error => {
      expect(error.message).toMatch("401");
      done();
    });
  });
});

test("will succeed if a good access token was provided", done => {
  jwt.sign(accessTokenData, JWT_SECRET, (error, accessToken) => {
    if (error) return done(error);

    const port = (server.address() as any).port;
    const socket = new WebSocket(
      `ws://localhost:${port}?access_token=${accessToken}`,
    );
    openSockets.push(socket);

    socket.on("error", error => {
      done(error);
    });

    socket.on("open", () => {
      done();
    });
  });
});

test("will fail if the access token expired", done => {
  jwt.sign(
    accessTokenData,
    JWT_SECRET,
    {expiresIn: "-1h"},
    (error, accessToken) => {
      if (error) return done(error);

      const port = (server.address() as any).port;
      const socket = new WebSocket(
        `ws://localhost:${port}?access_token=${accessToken}`,
      );
      openSockets.push(socket);

      socket.on("error", error => {
        expect(error.message).toMatch("401");
        done();
      });
    },
  );
});
