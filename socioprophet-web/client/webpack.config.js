const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
require('dotenv').config();

const APP_DIR = path.resolve(__dirname, './src');
const BUILD_DIR = path.join(__dirname, '/build');

const webpackConfig = () => {
  return {
    entry: APP_DIR + '/index.tsx',
    output: {
      path: BUILD_DIR,
      filename: 'bundle.js',
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js', '.jsx'],
    },
    module: {
      rules: [
        {
          test: /\.(js|jsx|ts|tsx)$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
          },
        },
        {
          test: /\.css$/,
          use: ['style-loader', 'css-loader'],
        },
        {
          test: /\.(jpg|gif|ico|jpeg|png)$/i,
          use: ['file-loader'],
        },
        {
          test: /\.(mov|mp4)$/,
          use: [
            {
              loader: 'file-loader',
              options: {
                name: '[name].[ext]',
              },
            },
          ],
        },
      ],
    },

    devServer: {
      host: '0.0.0.0',
      port: process.env.REACT_PORT,
      historyApiFallback: true,
      proxy: {
        '/api': `http://localhost:${process.env.NODE_PORT}`,
      },
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/favicon.ico',
      }),
      new CleanWebpackPlugin(),
    ],
  };
};

module.exports = webpackConfig;
