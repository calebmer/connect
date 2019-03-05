/**
 * Our webpack config is _heavily_ inspired by the
 * [`create-react-app` Webpack config][1].
 *
 * [1]: https://github.com/facebook/create-react-app/blob/6c8e2e53c5cca6226a5dc1509f6ca26f509fcbd7/packages/react-scripts/config/webpackDevServer.config.js
 */

const path = require("path");

const errorOverlayMiddleware = require("react-dev-utils/errorOverlayMiddleware");
const evalSourceMapMiddleware = require("react-dev-utils/evalSourceMapMiddleware");

module.exports = {
  port: 3000,
  // Silence WebpackDevServer's own logs since they're generally not useful.
  // It will still show compile warnings and errors with this setting.
  clientLogLevel: "none",
  // Enable gzip compression of generated files.
  compress: true,
  // By default WebpackDevServer serves physical files from current directory
  // in addition to all the virtual build products that it serves from memory.
  // This is confusing because those files won’t automatically be available in
  // production build folder unless we copy them. However, copying the whole
  // project directory is dangerous because we may expose sensitive files.
  // Instead, we establish a convention that only files in `public` directory
  // get served. Our build script will copy `public` into the `build` folder.
  // In `index.html`, you can get URL of `public` folder with %PUBLIC_URL%:
  // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
  // In JavaScript code, you can access it with `process.env.PUBLIC_URL`.
  // Note that we only recommend to use `public` folder as an escape hatch
  // for files like `favicon.ico`, `manifest.json`, and libraries that are
  // for some reason broken when imported through Webpack. If you just want to
  // use an image, put it in `src` and `import` it from JavaScript instead.
  contentBase: path.join(__dirname, "public"),
  // By default files from `contentBase` will not trigger a page reload.
  watchContentBase: true,
  // It is important to tell WebpackDevServer to use the same "root" path
  // as we specified in the config. In development, we always serve from /.
  publicPath: "/",
  // We use the overlay from `react-dev-utils`.
  overlay: false,
  // Serves our app from all URLs.
  historyApiFallback: {
    // Paths with dots should still use the history fallback.
    // See https://github.com/facebook/create-react-app/issues/387.
    disableDotRule: true,
  },
  before(app, server) {
    // This lets us fetch source contents from webpack for the error overlay
    app.use(evalSourceMapMiddleware(server));
    // This lets us open files from the runtime error overlay.
    app.use(errorOverlayMiddleware());
  },
};
