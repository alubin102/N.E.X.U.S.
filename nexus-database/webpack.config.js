const path = require('path');

module.exports = {
    mode: process.env.NODE_ENV || 'development',
    entry: {
        main: './js/app.js'
    },
    output: {
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
        chunkFilename: '[name].js',
        clean: true
    },
    devServer: {
        port: 8080,
        open: true,
        hot: true,
        historyApiFallback: true,
        static: {
            directory: path.join(__dirname)
        }
    },
    devtool: process.env.NODE_ENV === 'production' ? false : 'source-map',
    module: {
        rules: [
            {
                test: /\.css$/i,
                use: ['style-loader', 'css-loader']
            },
            {
                test: /\.(png|svg|jpg|jpeg|gif)$/i,
                type: 'asset/resource',
                generator: {
                    filename: 'images/[name][ext]'
                }
            },
            {
                test: /\.json$/i,
                type: 'asset/resource',
                generator: {
                    filename: '[name][ext]'
                }
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.json', '.css'],
        alias: {
            '@services': path.resolve(__dirname, 'js/services/'),
            '@pages': path.resolve(__dirname, 'js/views/pages/'),
            '@utils': path.resolve(__dirname, 'js/utils/')
        }
    },
    optimization: {
        minimize: process.env.NODE_ENV === 'production',
        splitChunks: {
            chunks: 'all'
        }
    },
    performance: {
        maxEntrypointSize: 512000,
        maxAssetSize: 512000
    }
};
