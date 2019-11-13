import path from "path";
import merge from "webpack-merge";
import MiniCssExtractPlugin from "mini-css-extract-plugin";
import CleanWebpackPlugin from "clean-webpack-plugin";
import OptimizeCssAssetsPlugin from "optimize-css-assets-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import safeParser from "postcss-safe-parser";
import webpack from "webpack";

import webpackCommon from "./webpack.common.config";

/**
 * @const folders resolution
 * @type {{root: *, build: (any)}}
 */
const PATHS = {
    "root": path.join(__dirname, "..", "src"),
    "build": path.join(__dirname, "..", "dist"),
    "nodeModules": path.join(__dirname, "..", "node_modules")
};

const productsJSON = require(`${PATHS.root}/app/products/products.json`);

const fileName = "[name].[contenthash]";
export default merge(webpackCommon(PATHS, fileName), {
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
        new OptimizeCssAssetsPlugin({
            "cssProcessorOptions": {
                "parser": safeParser,
                "discardComments": {
                    "removeAll": true
                }
            }
        }),
        new MiniCssExtractPlugin({
            "filename": `${fileName}.css`
        }),
        new webpack.DefinePlugin({
            "BUILD_VARS.AVAILABLE_PRODUCTS": JSON.stringify(productsJSON.products)
        })
    ]
});
