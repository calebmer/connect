if (typeof window !== "undefined") {
  throw new Error("Should only run in a Node.js runtime.");
}

if (process.env.NODE_ENV === "development" || typeof jest !== "undefined") {
  module.exports = require("./src");
} else {
  module.exports = require("./build");
}
