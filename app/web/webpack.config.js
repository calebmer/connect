/**
 * Our webpack config is _heavily_ inspired by the
 * [`create-react-app` Webpack config][1].
 *
 * [1]: https://github.com/facebook/create-react-app/blob/6c8e2e53c5cca6226a5dc1509f6ca26f509fcbd7/packages/react-scripts/config/webpack.config.js
 */

const path = require("path");
const webpack = require("webpack");
const TerserPlugin = require("terser-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const InlineChunkHtmlPlugin = require("react-dev-utils/InlineChunkHtmlPlugin");
const ModuleNotFoundPlugin = require("react-dev-utils/ModuleNotFoundPlugin");

const dev = process.env.NODE_ENV !== "production";

const appDirectory = path.resolve(__dirname, "..");
const workspaceDirectory = path.resolve(appDirectory, "..");

module.exports = {
  context: appDirectory,
  mode: dev ? "development" : "production",
  bail: !dev,
  devtool: dev ? "cheap-module-source-map" : "source-map",

  entry: [
    // Include an alternative client for `WebpackDevServer`. We use the
    // `create-react-app` dev client because it displays nice error overlays.
    dev && require.resolve("react-dev-utils/webpackHotDevClient"),
    // Web entry file!
    path.join(appDirectory, "src", "main"),
  ].filter(Boolean),

  output: {
    // The build folder.
    path: path.join(__dirname, "build"),
    // Add /* filename */ comments to generated require()s in the output.
    pathinfo: dev,
    // We serve from the root path.
    publicPath: "/",
    // There will be one main bundle, and one file per asynchronous chunk.
    // In development, it does not produce real files.
    filename: dev
      ? "static/js/bundle.js"
      : "static/js/[name].[contenthash:8].js",
    // There are also additional JS chunk files if you use code splitting.
    chunkFilename: dev
      ? "static/js/[name].chunk.js"
      : "static/js/[name].[contenthash:8].chunk.js",
  },

  resolve: {
    // Web specific module implementations will be written with the `.web`
    // extension as compared to the `.ios`, `.android`, and
    // `.native` extensions.
    extensions: [
      ".web.ts",
      ".ts",
      ".web.tsx",
      ".tsx",
      ".web.js",
      ".js",
      ".web.jsx",
      ".jsx",
    ],
    // Alias all `react-native` imports to `react-native-web`.
    alias: {
      "react-native$": "react-native-web",
    },
  },

  module: {
    strictExportPresence: true,
    rules: [
      // Disable require.ensure as it's not a standard language feature.
      {parser: {requireEnsure: false}},

      // Process application JS with Babel.
      // The preset includes JSX, Flow, TypeScript, and some ESNext features.
      {
        test: /\.(js|jsx|ts|tsx)$/,
        include: workspaceDirectory,
        exclude: /node_modules/,
        loader: require.resolve("babel-loader"),
        options: {
          plugins: ["react-native-web"],
          // This is a feature of `babel-loader` for webpack (not Babel itself).
          // It enables caching results in ./node_modules/.cache/babel-loader/
          // directory for faster rebuilds.
          cacheDirectory: true,
          cacheCompression: !dev,
          compact: !dev,
        },
      },

      // This is needed for webpack to import static images in JavaScript files.
      {
        test: /\.(gif|jpe?g|png|svg)$/,
        use: {
          loader: "url-loader",
          options: {
            name: "[name].[ext]",
          },
        },
      },
    ],
  },

  optimization: dev
    ? undefined
    : {
        minimize: true,
        minimizer: [
          // This is only used in production mode
          new TerserPlugin({
            terserOptions: {
              parse: {
                // we want terser to parse ecma 8 code. However, we don't want
                // it to apply any minfication steps that turns valid ecma 5
                // code into invalid ecma 5 code. This is why the 'compress' and
                // 'output' sections only apply transformations that are ecma 5 safe
                // https://github.com/facebook/create-react-app/pull/4234
                ecma: 8,
              },
              compress: {
                ecma: 5,
                warnings: false,
                // Disabled because of an issue with Uglify breaking seemingly
                // valid code:
                // https://github.com/facebook/create-react-app/issues/2376
                // Pending further investigation:
                // https://github.com/mishoo/UglifyJS2/issues/2011
                comparisons: false,
                // Disabled because of an issue with Terser breaking valid code:
                // https://github.com/facebook/create-react-app/issues/5250
                // Pending further investigation:
                // https://github.com/terser-js/terser/issues/120
                inline: 2,
              },
              mangle: {
                safari10: true,
              },
              output: {
                ecma: 5,
                comments: false,
                // Turned on because emoji and regex is not minified properly
                // using default
                // https://github.com/facebook/create-react-app/issues/2488
                ascii_only: true,
              },
            },
            // Use multi-process parallel running to improve the build speed
            // Default number of concurrent runs: os.cpus().length - 1
            parallel: true,
            // Enable file caching
            cache: true,
            sourceMap: true,
          }),
        ],
        // Automatically split vendor and commons
        // https://twitter.com/wSokra/status/969633336732905474
        // https://medium.com/webpack/webpack-4-code-splitting-chunk-graph-and-the-splitchunks-optimization-be739a861366
        splitChunks: {
          chunks: "all",
          name: false,
        },
        // Keep the runtime chunk separated to enable long term caching
        // https://twitter.com/wSokra/status/969679223278505985
        runtimeChunk: true,
      },

  plugins: [
    // Generates an `index.html` file with the <script> injected.
    new HtmlWebpackPlugin(
      Object.assign(
        {},
        {
          inject: true,
          template: path.join(__dirname, "public", "index.html"),
        },
        !dev
          ? {
              minify: {
                removeComments: true,
                collapseWhitespace: true,
                removeRedundantAttributes: true,
                useShortDoctype: true,
                removeEmptyAttributes: true,
                removeStyleLinkTypeAttributes: true,
                keepClosingSlash: true,
                minifyJS: true,
                minifyCSS: true,
                minifyURLs: true,
              },
            }
          : undefined,
      ),
    ),
    // Inlines the webpack runtime script. This script is too small to warrant
    // a network request.
    !dev && new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/runtime~.+[.]js/]),
    // This gives some necessary context to module not found errors, such as
    // the requesting resource.
    new ModuleNotFoundPlugin(workspaceDirectory),
    // It is absolutely essential that `NODE_ENV` is set to production during a
    // production build. Otherwise React will be compiled in the very slow
    // development mode.
    new webpack.DefinePlugin({
      "process.env.NODE_ENV": dev ? '"development"' : '"production"',
    }),
    // Moment.js is an extremely popular library that bundles large locale files
    // by default due to how Webpack interprets its code. This is a practical
    // solution that requires the user to opt into importing specific locales.
    // https://github.com/jmblog/how-to-optimize-momentjs-with-webpack
    // You can remove this if you don't use Moment.js:
    new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
  ].filter(Boolean),

  // Some libraries import Node modules but don't use them in the browser.
  // Tell Webpack to provide empty mocks for them so importing them works.
  node: {
    module: "empty",
    dgram: "empty",
    dns: "mock",
    fs: "empty",
    net: "empty",
    tls: "empty",
    child_process: "empty",
  },
};
