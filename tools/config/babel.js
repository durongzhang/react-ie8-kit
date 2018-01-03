let preset = {
  presets: [
    require.resolve("babel-preset-es2015"),
    require.resolve("babel-preset-react"),
    require.resolve("babel-preset-stage-0")
  ],
  plugins: [
    require.resolve("babel-plugin-transform-runtime"),
    [
      require.resolve("babel-plugin-import"),
      {
        libraryName: "antd"
      }
    ]
  ]
};

var env = process.env.BABEL_ENV || process.env.NODE_ENV;

if (env === "development") {
  preset.plugins.push.apply(preset.plugins, [
    // 将组件堆栈添加到警告消息
    require.resolve("babel-plugin-transform-react-jsx-source")
  ]);
}

if (env === "production") {
  // 移除propTypes定义来减少大小
  preset.plugins.push.apply(preset.plugins, [
    require.resolve("babel-plugin-transform-react-remove-prop-types")
  ]);
}

module.exports = preset;
