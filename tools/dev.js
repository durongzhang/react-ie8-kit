process.env.NODE_ENV = 'development';

const fs = require('fs-extra');
const webpack = require('webpack');
const paths = require('./config/paths');
const createConfig = require('./config/createConfig');
const devServer = require('webpack-dev-server');
const printErrors = require('./utils/printErrors');
const clearConsole = require('react-dev-utils/clearConsole');
const logger = require('./utils/logger');

process.noDeprecation = true;

// node调试
if (process.argv.includes('--inspect')) {
  process.env.INSPECT_ENABLED = true;
}

logger.start('Compiling...');
let razzle = {};

// 是否存在配置文件
if (fs.existsSync(paths.appConfig)) {
  try {
    razzle = require(paths.appConfig);
  } catch (e) {
    clearConsole();
    logger.error('Invalid config.js file.', e);
    process.exit(1);
  }
}

fs.removeSync(paths.appManifest);

let clientConfig = createConfig('web', 'dev', razzle);
let serverConfig = createConfig('node', 'dev', razzle);

if (razzle.modify) {
  clientConfig = razzle.modify(
    clientConfig,
    { target: 'web', dev: true },
    webpack
  );
  serverConfig = razzle.modify(
    serverConfig,
    { target: 'node', dev: true },
    webpack
  );
}

const serverCompiler = compile(serverConfig);

serverCompiler.watch(
  {
    quiet: true,
    stats: 'none',
  },
  stats => {}
);

const clientCompiler = compile(clientConfig);

const clientDevServer = new devServer(clientCompiler, clientConfig.devServer);

// Start Webpack-dev-server
clientDevServer.listen(
  (process.env.PORT && parseInt(process.env.PORT) + 1) || razzle.port || 3001,
  err => {
    if (err) {
      logger.error(err);
    }
  }
);

function compile(config) {
  let compiler;
  try {
    compiler = webpack(config);
  } catch (e) {
    printErrors('Failed to compile.', [e]);
    process.exit(1);
  }
  return compiler;
}