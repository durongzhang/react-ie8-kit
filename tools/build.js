// 注入正式环境变量
process.env.NODE_ENV = "production";

// 防止未处理的崩溃
process.on("unhandledRejection", err => {
  throw err;
});

// 确保env中读到修改后的环境变量，方便后面直接读取
require("./config/env");
const webpack = require("webpack");
const fs = require("fs-extra");
const chalk = require("chalk");
const paths = require("./config/paths");
const createConfig = require("./config/createConfig");
const printErrors = require("./utils/printErrors");
const logger = require("./utils/logger");
const FileSizeReporter = require("react-dev-utils/FileSizeReporter");
const formatWebpackMessages = require("react-dev-utils/formatWebpackMessages");

const measureFileSizesBeforeBuild =
  FileSizeReporter.measureFileSizesBeforeBuild;
const printFileSizesAfterBuild = FileSizeReporter.printFileSizesAfterBuild;

//首先，读取build目录中的当前文件大小。
//这让我们显示他们稍后改变了多少。
measureFileSizesBeforeBuild(paths.appBuildPublic).then(previousFileSizes => {
  //删除所有的内容，但保持该目录
  fs.emptyDirSync(paths.appBuild);

  // 与公用文件夹合并
  copyPublicFolder();

  // 开启webpack打包
  return build(previousFileSizes);
});

function build(previousFileSizes) {
  let config = {};
  try {
    config = require(paths.appConfig);
  } catch (e) {}

  if (config.clearConsole === false || !!config.host || !!config.port) {
    logger.warn(`Specifying options \`port\`, \`host\`, and \`clearConsole\` in config.js has been deprecated. 
      Please use a .env file instead.

      ${config.host !== "localhost" && `HOST=${config.host}`}
      ${config.port !== "3000" && `PORT=${config.port}`}`);
  }

  // 创建生产webpack配置，并通过配置。
  let clientConfig = createConfig("web", "prod", config);
  let serverConfig = createConfig("node", "prod", config);

  //检查是否具有修改
  if (config.modify) {
    clientConfig = config.modify(
      clientConfig,
      { target: "web", dev: false },
      webpack
    );
    serverConfig = config.modify(
      serverConfig,
      { target: "node", dev: false },
      webpack
    );
  }

  // 关闭loadQuery。
  process.noDeprecation = true;

  console.log("Creating an optimized production build...");
  console.log("Compiling client...");

  return new Promise((resolve, reject) => {
    compile(clientConfig, (err, clientStats) => {
      if (err) {
        reject(err);
      }
      const clientMessages = formatWebpackMessages(
        clientStats.toJson({}, true)
      );
      if (clientMessages.errors.length) {
        return reject(new Error(clientMessages.errors.join("\n\n")));
      }
      if (
        process.env.CI &&
        (typeof process.env.CI !== "string" ||
          process.env.CI.toLowerCase() !== "false") &&
        clientMessages.warnings.length
      ) {
        console.log(
          chalk.yellow(
            "\nTreating warnings as errors because process.env.CI = true.\n" +
              "Most CI servers set it automatically.\n"
          )
        );
        return reject(new Error(clientMessages.warnings.join("\n\n")));
      }

      console.log(chalk.green("Compiled client successfully."));
      console.log("Compiling server...");
      compile(serverConfig, (err, serverStats) => {
        if (err) {
          reject(err);
        }
        const serverMessages = formatWebpackMessages(
          serverStats.toJson({}, true)
        );
        if (serverMessages.errors.length) {
          return reject(new Error(serverMessages.errors.join("\n\n")));
        }
        if (
          process.env.CI &&
          (typeof process.env.CI !== "string" ||
            process.env.CI.toLowerCase() !== "false") &&
          serverMessages.warnings.length
        ) {
          console.log(
            chalk.yellow(
              "\nTreating warnings as errors because process.env.CI = true.\n" +
                "Most CI servers set it automatically.\n"
            )
          );
          return reject(new Error(serverMessages.warnings.join("\n\n")));
        }
        console.log(chalk.green("Compiled server successfully."));
        return resolve({
          stats: clientStats,
          previousFileSizes,
          warnings: Object.assign(
            {},
            clientMessages.warnings,
            serverMessages.warnings
          )
        });
      });
    });
  });
}

// 助手功能 主要是复制公共目录到build/public
function copyPublicFolder() {
  fs.copySync(paths.appPublic, paths.appBuildPublic, {
    dereference: true,
    filter: file => file !== paths.appHtml
  });
}

// 把webpack编译成try catch。
function compile(config, cb) {
  let compiler;
  try {
    compiler = webpack(config);
  } catch (e) {
    printErrors("Failed to compile.", [e]);
    process.exit(1);
  }
  compiler.run((err, stats) => {
    cb(err, stats);
  });
}
