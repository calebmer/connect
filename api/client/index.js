if (typeof window !== "undefined") {
  throw new Error("Should only run in a Node.js runtime.");
}

if (__DEV__ || __TEST__) {
  module.exports = require("./src");
} else {
  module.exports = require("./build");
}
