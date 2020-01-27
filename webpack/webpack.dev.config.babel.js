import { CleanWebpackPlugin } from "clean-webpack-plugin";
import merge from "webpack-merge";
import webpackCommon from "./webpack.common.config";
import MiniCssExtractPlugin from "mini-css-extract-plugin";

export default merge(webpackCommon, {
    "devtool": "cheap-module-eval-source-map",
    "mode": "development",
    "module": {
        "rules": [
            {
                test: /\.(sa|sc|c)ss$/,
                "use": ["style-loader", "css-loader", "sass-loader"]
            }
        ]
    },
    "optimization": {
        "namedModules": true
    },
    "plugins": [
        new CleanWebpackPlugin({
            "cleanAfterEveryBuildPatterns": ["!manifest.json", "!img/**"]
        })
    ]
});
