import {CleanWebpackPlugin} from "clean-webpack-plugin";
import merge from "webpack-merge";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import SpeedMeasurePlugin from "speed-measure-webpack-plugin";

import webpackCommon from "./webpack.common.config";
const smp = new SpeedMeasurePlugin();

export default smp.wrap(merge(webpackCommon, {
    "mode": "production",
    "module": {
        "rules": [
            {
                "test": /\.css$/,
                "use": [
                    MiniCssExtractPlugin.loader,
                    "css-loader"
                ]
            }
        ]
    },
    "optimization": {
        "minimizer": [
            new TerserPlugin({
                cache: true,
                parallel: true,
                "terserOptions": {
                    ecma: 8,
                    safari10: true
                }
            })
        ]
    },
    "plugins": [
        new CleanWebpackPlugin(),
        new MiniCssExtractPlugin({
            "filename": "[name].[contenthash].css"
        }),
        new OptimizeCssAssetsPlugin()
    ]
}));
