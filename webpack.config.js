const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');

const path = require("path");

module.exports = {
  entry: "./src/app.js",
  mode: "development",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js"
  },
  
  devServer: {
    historyApiFallback: true,
    open: true,
    compress: true,
    hot: true,
    https: true,
    host: 'localhost',
    port: 3030
  },   

  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      },      
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template:'src/index.html',
      title: 'DRAGONS AND ROBOTS',
      output: 'index.html'
    }),
    new CopyPlugin({
      patterns: [
        { from: 'assets', to: 'assets' },
      ],
    }),
    new webpack.ProvidePlugin({
      $: 'webpack-zepto',
      Zepto: 'webpack-zepto'
    })     
  ]
};
