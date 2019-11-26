import {CleanWebpackPlugin} from "clean-webpack-plugin";
import merge from "webpack-merge";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

import webpackCommon from "./webpack.common.config";

export default merge(webpackCommon, {
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
                "cache": true,
                "parallel": true,
                "sourceMap": true,
                "terserOptions": {
                    "minimize": true,
                    "compress": {
                        "warnings": true
                    }
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
});
