var fs = require('fs');

//get list of node modules for webpack to avoid bundling on server
const nodeModules = fs.readdirSync('node_modules')
  .filter((x) => ['.bin'].indexOf(x) === -1)
  .reduce(
    (acc, mod) => Object.assign(acc, { [mod]: true }),
    {}
  );

module.exports = {
  entry: [
    './main.js',
  ],

  output: {
    filename: 'index.js',
  },

  target: 'web',

  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        loader: 'babel', // 'babel-loader' is also a legal name to reference
        query: {
          presets: ['es2015'],
        },
      },
    ],
  },
};
