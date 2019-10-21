const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');

module.exports = {
    entry: './src/_entrypoint.tsx',
    output: {
        path: path.join(__dirname, 'doc')
    },
    resolve: {
        extensions: [
            '.ts', '.tsx', '.js', '.sass', '.scss'
        ]
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: /node_modules/,
                loader: 'ts-loader'
            },
            {
              test: /\.s[ac]ss$/i,
              use: [
                'style-loader',
                'css-loader',
                'sass-loader',
              ]
            }
        ]
    },
    plugins: [
      new HtmlWebpackPlugin({title: null})
    ]
};