function getConfig(options) {
  const qs = require('qs');
  const webpack = require('webpack');
  const path = require('path');
  const autoprefixer = require('autoprefixer');
  const HtmlWebpackPlugin = require('html-webpack-plugin');
  const HtmlWebpackHarddiskPlugin = require('html-webpack-harddisk-plugin');
  const ExtractTextPlugin = require('extract-text-webpack-plugin');
  const CleanWebpackPlugin = require('clean-webpack-plugin');
  // const CopyWebpackPlugin = require('copy-webpack-plugin');
  const extractCSS = new ExtractTextPlugin({ filename: 'css/[name].css' });

  const isProduction = (options.env === 'prod');
  const plugins = [];
  const projectPath = path.resolve(__dirname, '../');
  const htmlMinifyOptions = {
    removeAttributeQuotes: true,
    collapseWhitespace: true,
    html5: true,
    minifyCSS: true,
    removeComments: true,
    removeEmptyAttributes: true,
  };
  const dir = {
    src: `${projectPath}/src`,
    mocks: `${projectPath}/src/__mocks__/`,
    css: `${projectPath}/css`,
    config: `${projectPath}/config`,
    build: `${projectPath}/.tmp/build`,
    dist: `${projectPath}/.tmp/dist`,
  };

  plugins.push(extractCSS);
  plugins.push(new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/));
  plugins.push(new webpack.HashedModuleIdsPlugin());
  plugins.push(new webpack.EnvironmentPlugin({
    NODE_ENV: isProduction ? 'production' : 'development',
    DEBUG_MODE: !!options.isDebug,
  }));

  plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'vendor',
    minChunks(module) {
      // this assumes your vendor imports exist in the node_modules directory
      if (module.resource && (/^.*\.(css|scss|sass|less)$/).test(module.resource)) {
        return false;
      }

      return module.context && module.context.indexOf('node_modules') !== -1;
    },
  }));

  plugins.push(new webpack.optimize.CommonsChunkPlugin({
    name: 'manifest',
    minChunks: Infinity,
  }));

  plugins.push(new CleanWebpackPlugin([
    isProduction ? dir.dist : dir.build,
  ], {
    root: projectPath,
    verbose: true,
    dry: false,
  }));

  // MultiPages
  plugins.push(new HtmlWebpackPlugin({
    title: 'Index',
    template: `${dir.mocks}/html/index.ejs`,
    minify: isProduction ? htmlMinifyOptions : false,
    alwaysWriteToDisk: true,
    chunks: ['manifest', 'vendor', 'index'],
  }));

  // production builds
  if (isProduction) {
    plugins.push(new webpack.optimize.UglifyJsPlugin({ sourcemap: false }));
  } else {
    plugins.push(new HtmlWebpackHarddiskPlugin());
    // plugins.push(new CopyWebpackPlugin([{
    //   from: `${dir.mocks}/api/`,
    //   to: `${dir.build}/api/`,
    // }]));
  }

  return {
    context: projectPath,
    devtool: !isProduction ? 'inline-sourcemap' : false,
    entry: {
      vendor: [
        'moment',
        'react',
        'react-dom',
      ],
      index: `${dir.src}/js/Index.js`,
    },
    output: {
      path: isProduction ? dir.dist : dir.build,
      filename: 'js/[name].[chunkhash].js',
      publicPath: '/',
    },
    externals: {
      jquery: 'jQuery',
    },
    module: {
      rules: [{
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
        }],
      }, {
        test: /\.sass|scss$/,
        use: extractCSS.extract({
          fallback: 'style-loader',
          use: [{
            loader: 'css-loader',
            options: {
              camelCase: true,
              url: false,
              minimize: isProduction,
              sourceMap: isProduction,
              modules: false,
              localIdentName: '[local]--[hash:base64:12]',
            },
          }, {
            loader: 'postcss-loader',
            options: {
              plugins: [
                // browser list doc -> https://github.com/ai/browserslist#queries
                autoprefixer({ browsers: ['last 2 versions'] }),
              ],
            },
          }, {
            loader: 'sass-loader',
            // options doc -> https://github.com/sass/node-sass
            options: {
              includePaths: [
                `${dir.src}/css`,
              ],
            },
          }],
        }),
      }, {
        test: /\.svg$/,
        use: [{
          loader: 'svg-inline-loader',
        }],
      }],
    },
    plugins,
    resolve: {
      alias: {
        __svg: `${dir.src}/img/icon`,
      },
      extensions: ['.js', '.jsx', '.json'],
      modules: [
        dir.src,
        `${dir.src}/js`,
        'node_modules',
      ],
    },
    devServer: {
      contentBase: dir.build,
      port: 8000,
      host: 'localhost',
      open: true,
      inline: true,
      historyApiFallback: true,
      before(app) {
        app.get('/sleep', (req, res) => {
          const params = qs.parse(req.url.split('?')[1]);
          let delay = +params.delay;

          delay = isNaN(delay) ? 0 : delay;

          setTimeout(() => {
            res.json({ delay });
          }, delay);
        });
      },
    },
  };
}

module.exports = getConfig;
