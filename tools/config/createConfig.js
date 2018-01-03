const path = require("path");
const webpack = require("webpack");
const UglifyJsPlugin = require("uglifyjs-webpack-plugin");
const nodeExternals = require("webpack-node-externals");
const AssetsPlugin = require("assets-webpack-plugin");
const StartServerPlugin = require("start-server-webpack-plugin");
const FriendlyErrorsPlugin = require("../utils/FriendlyErrorsPlugin");
const eslintFormatter = require("react-dev-utils/eslintFormatter");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const errorOverlayMiddleware = require("react-dev-utils/errorOverlayMiddleware");
const Es3ifyPlugin = require("es3ify-webpack-plugin");
const paths = require("./paths");
const getClientEnv = require("./env").getClientEnv;
const nodePath = require("./env").nodePath;

module.exports = (
  target = "web",
  env = "dev",
  { clearConsole = true, host = "localhost", port = 3000 }
) => {
  // 定义一些标记。
  const IS_NODE = target === "node";
  const IS_WEB = target === "web";
  const IS_PROD = env === "prod";
  const IS_DEV = env === "dev";
  process.env.NODE_ENV = IS_PROD ? "production" : "development";

  const dotenv = getClientEnv(target, { clearConsole, host, port });
  const devServerPort = parseInt(dotenv.raw.PORT, 10) + 1;

  let config = {
    target: target,
    devtool: IS_DEV ? "cheap-module-source-map" : false,
    module: {
      // 解决defineProperty问题
      postLoaders: [
        {
          test: /\.(js|jsx)$/,
          loader: "export-from-ie8/loader"
        }
      ],
      loaders: [
        {
          test: /\.(js|jsx)$/,
          loader: require.resolve("babel-loader"),
          include: [paths.appSrc],
          query: {
            presets: [require.resolve("./babel")]
          }
        },
        {
          exclude: [
            /\.html$/,
            /\.(js|jsx)$/,
            /\.(ts|tsx)$/,
            /\.(vue)$/,
            /\.(less)$/,
            /\.(re)$/,
            /\.(s?css|sass)$/,
            /\.json$/,
            /\.bmp$/,
            /\.gif$/,
            /\.jpe?g$/,
            /\.png$/
          ],
          loader: require.resolve("file-loader"),
          query: {
            name: "static/media/[name].[hash:8].[ext]"
          }
        },
        {
          test: /\.json$/,
          loader: "json-loader"
        },
        {
          test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
          loader: require.resolve("url-loader"),
          query: {
            limit: 10000,
            name: "static/media/[name].[hash:8].[ext]"
          }
        },
        {
          test: /\.css$/,
          exclude: [paths.appBuild],
          loader: IS_NODE
            ? "css-loader"
            : IS_DEV
              ? "style-loader!css-loader"
              : ExtractTextPlugin.extract(
                  "style-loader",
                  "css-loader",
                  "postcss-loader"
                )
        }
      ]
    }
  };

  if (IS_NODE) {
    // 我们要维护node的__filename和__dirname
    config.node = { console: true, __filename: true, __dirname: true };

    // 需要告诉webpack绑定到我们的Node包中的东西
    config.externals = [
      nodeExternals({
        whitelist: [
          IS_DEV ? "webpack/hot/poll?300" : null,
          /\.(eot|woff|woff2|ttf|otf)$/,
          /\.(svg|png|jpg|jpeg|gif|ico)$/,
          /\.(mp4|mp3|ogg|swf|webp)$/,
          /\.(css|scss|sass|sss|less)$/
        ].filter(x => x)
      })
    ];

    // 指定webpack Node.js输出路径和文件名
    config.output = {
      path: paths.appBuild,
      publicPath: IS_DEV ? `http://${dotenv.raw.HOST}:${devServerPort}/` : "/",
      filename: "server.js"
    };
    // Add some plugins...
    config.plugins = [
      // This makes debugging much easier as webpack will add filenames to
      // modules
      new webpack.NamedModulesPlugin(),
      // We define environment variables that can be accessed globally in our
      new webpack.DefinePlugin(dotenv.stringified),
      // Prevent creating multiple chunks for the server
      new webpack.optimize.LimitChunkCountPlugin({
        maxChunks: 1
      })
    ];

    config.entry = [paths.appServerIndexJs];

    if (IS_DEV) {
      // Use watch mode
      config.watch = true;
      config.entry.unshift("webpack/hot/poll?300");

      const nodeArgs = [];

      // Add --inspect flag when inspect is enabled
      if (process.env.INSPECT_ENABLED) {
        nodeArgs.push("--inspect");
      }

      config.plugins = [
        ...config.plugins,
        // Add hot module replacement
        new webpack.HotModuleReplacementPlugin(),
        // Supress errors to console (we use our own logger)
        new webpack.NoErrorsPlugin(),
        // Automatically start the server when we are done compiling
        new StartServerPlugin({
          name: "server.js",
          nodeArgs
        }),
        // Ignore assets.json to avoid infinite recompile bug
        new webpack.WatchIgnorePlugin([paths.appManifest])
      ];
    }
  }

  if (IS_WEB) {
    config.plugins = [
      // 再次使用NamesModules来帮助调试
      new webpack.NamedModulesPlugin(),
      //将我们的JS和CSS文件输出到名为assets.json的清单文件中
      //在构建目录中。
      new AssetsPlugin({
        path: paths.appBuild,
        filename: "assets.json"
      }),
      new Es3ifyPlugin()
    ];

    if (IS_DEV) {
      config.entry = {
        client: [
          //默认情况下我们会发布一些polyfill，但是只有在React被放入时才会包含它们
          //默认路径 如果你正在做一些供应商捆绑，你需要使用razzle / polyfills
          //你自己。
          !!dotenv.raw.REACT_BUNDLE_PATH && require.resolve("./polyfills"),
          require.resolve("../utils/webpackHotDevClient"),
          paths.appClientIndexJs
        ].filter(Boolean)
      };

      config.output = {
        path: paths.appBuildPublic,
        publicPath: `http://${dotenv.raw.HOST}:${devServerPort}/`,
        pathinfo: true,
        filename: "static/js/bundle.js",
        chunkFilename: "static/js/[name].chunk.js",
        devtoolModuleFilenameTemplate: info =>
          path.resolve(info.resourcePath).replace(/\\/g, "/")
      };

      config.devServer = {
        disableHostCheck: true,
        clientLogLevel: "none",
        // 启用生成文件的gzip压缩
        compress: true,
        // watchContentBase: true,
        headers: {
          "Access-Control-Allow-Origin": "*"
        },
        historyApiFallback: {
          // Paths with dots should still use the history fallback.
          // See https://github.com/facebookincubator/create-react-app/issues/387.
          disableDotRule: true
        },
        host: dotenv.raw.HOST,
        hot: true,
        noInfo: true,
        overlay: false,
        port: devServerPort,
        quiet: true,
        // By default files from `contentBase` will not trigger a page reload.
        // Reportedly, this avoids CPU overload on some systems.
        // https://github.com/facebookincubator/create-react-app/issues/293
        watchOptions: {
          ignored: /node_modules/
        },
        setup(app) {
          // This lets us open files from the runtime error overlay.
          app.use(errorOverlayMiddleware());
        }
      };

      config.plugins = [
        ...config.plugins,
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NoErrorsPlugin(),
        new webpack.DefinePlugin(dotenv.stringified)
      ];
    } else {
      config.entry = {
        client: [
          "console-polyfill",
          "es5-shim",
          "es5-shim/es5-sham",
          "html5shiv",
          "babel-polyfill",
          paths.appClientIndexJs
        ]
      };

      config.output = {
        path: paths.appBuildPublic,
        publicPath: dotenv.raw.PUBLIC_PATH || "/",
        filename: "static/js/bundle.[chunkhash:8].js",
        chunkFilename: "static/js/[name].[chunkhash:8].chunk.js"
      };

      config.plugins = [
        ...config.plugins,
        // 定义生产环境变量
        new webpack.DefinePlugin(dotenv.stringified),
        new UglifyJsPlugin({
          mangle: { screw_ie8: false },
          mangleProperties: { screw_ie8: false },
          compress: { screw_ie8: false },
          output: { screw_ie8: false }
        }),
        // 将CSS解压缩到一个文件中
        new ExtractTextPlugin("static/css/bundle.[contenthash:8].css")
      ];
    }
  }

  if (IS_DEV) {
    config.plugins = [
      ...config.plugins,
      //在开发过程中使用FriendlyErrorsPlugin。
      new FriendlyErrorsPlugin({
        verbose: dotenv.raw.VERBOSE,
        target,
        onSuccessMessage: `Your application is running at http://${
          dotenv.raw.HOST
        }:${dotenv.raw.PORT}`
      })
    ];
  }

  return config;
};
