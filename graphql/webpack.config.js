const path = require('path');
const nodeExternals = require('webpack-node-externals');

module.exports = {
  entry: {
    endpoint: ['./src/index'],
    lambda: ['./src/lambda'],
  },
  output: {
    path: path.join(__dirname, 'dist'),
    filename: '[name].js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        loader: 'babel-loader',
        query: {
          babelrc: true,
        },
        include: [path.join(__dirname, 'config'), path.join(__dirname, 'src')],
      },
      {
        test: /\.json$/,
        loader: 'json-loader',
      },
    ],
  },
  target: 'node', // important in order not to bundle built-in modules like path, fs, etc.
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
};
