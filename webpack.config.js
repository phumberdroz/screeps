module.exports = {
  devtool: 'source-map',
  entry: './src/main.js',
  output: {
    filename: './dist/[name].js',
    pathinfo: true,
    libraryTarget: 'commonjs2',
    sourceMapFilename: '[file].map.js', // normally this is [file].map, but we need a js file, or it will be rejected by screeps server.
    devtoolModuleFilenameTemplate: '[resource-path]',
  },

  target: 'node',

  node: {
    console: true,
    global: true,
    process: false,
    Buffer: false,
    __filename: false,
    __dirname: false,
  },

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.js']
  },

  externals: [
    {
        // webpack will not try to rewrite require("main.js.map")
        'main.js.map': './main.js.map',
    },
  ],

  module: {
    rules: [
      // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: 'source-map-loader', enforce: 'pre' },
    ],
  },
};
