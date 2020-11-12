import { CleanWebpackPlugin } from "clean-webpack-plugin";
import merge from "webpack-merge";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import SpeedMeasurePlugin from "speed-measure-webpack-plugin";

import webpackCommon from "./webpack.common.config";

// doesn't work with Webpack 5 : https://github.com/stephencookdev/speed-measure-webpack-plugin/issues/150
// const smp = new SpeedMeasurePlugin();
// export default smp.wrap(merge(webpackCommon, {
export default merge(webpackCommon, {
    "mode": "production",
    "module": {
        "rules": [
            {
                test: /\.(sa|sc|c)ss$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    'css-loader',
                    'sass-loader',
                ],
            }
        ]
    },
    "optimization": {
        "minimizer": true,
        "minimizer": [
            new TerserPlugin()
        ]
    },
    "plugins": [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            "filename": "[name].[contenthash].css"
        }),
        new OptimizeCssAssetsPlugin()
    ]
});
