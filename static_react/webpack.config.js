/**
 * Created by diana on 30.04.2017.
 */

const webpack = require('webpack');
const path = require('path');

var ExtractTextPlugin = require('extract-text-webpack-plugin');
var plugins = [];
plugins.push(
    new ExtractTextPlugin('../css/bundle.css')
);

module.exports = {
    entry: [
        path.join(__dirname, 'src', 'app-client.js'),
        path.join(__dirname, 'css', 'dev.styl'),
    ],
    output: {
        path: path.join(__dirname, 'src', 'static', 'js'),
        filename: 'bundle.js'
    },
    module: {
        loaders: [{
            test: /\.js$/,
            exclude: /node_modules/,
            loader: 'babel-loader',
            query: {
                cacheDirectory: 'babel_cache',
                presets: ['react', 'es2015', 'stage-2'],
                plugins: ['transform-es2015-destructuring', 'transform-object-rest-spread', 'transform-decorators-legacy']
            }
        }, {
            test: /\.styl$/,
            loader: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: ['css-loader', 'stylus-loader']//"!!"
            })
        }, {
            test: /\.css$/,
            loader: ExtractTextPlugin.extract({
                fallback: 'style-loader',
                use: 'css-loader'
            })
        }, {
            test: /.(png|svg|jpg|woff(2)?|eot|ttf)(\?[a-z0-9=\.]+)?$/,
            loader: 'file-loader?name='+ path.join(__dirname, 'src', 'static', 'css') +'/[hash].[ext]'
        }]
    },
    plugins: plugins,
    resolve: {
        extensions: ['.js', '.styl', '.css']
    }
};