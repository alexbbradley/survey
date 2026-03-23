const path                = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProd = argv.mode === 'production';

  return {
    entry: './src/index.js',

    output: {
      path:     path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      clean:    true,
    },

    module: {
      rules: [
        {
          test: /\.css$/i,
          use: [
            isProd ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        },
      ],
    },

    plugins: [
      isProd && new MiniCssExtractPlugin({ filename: 'bundle.css' }),
    ].filter(Boolean),

    devServer: {
      port:         1234,
      hot:          true,
      allowedHosts: 'all',
      headers: { 'Access-Control-Allow-Origin': '*' },
      devMiddleware: {
        publicPath: '/gantt/',
      },
      proxy: [
        {
          context:      ['/gantt/'],
          target:       'http://localhost',
          changeOrigin: true,
        },
      ],
    },

    devtool: isProd ? false : 'eval-cheap-module-source-map',
  };
};
