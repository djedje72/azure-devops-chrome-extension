import {CleanWebpackPlugin} from "clean-webpack-plugin";
import webpack from "webpack";
import merge from "webpack-merge";
import webpackCommon from "./webpack.common.config";

export default merge(webpackCommon, {
    "devtool": "cheap-module-eval-source-map",
    "mode": "development",
    "module": {
        "rules": [
            {
                "test": /\.css$/,
                "use": ["style-loader", "css-loader"]
            }
        ]
    },
    "optimization": {
        "namedModules": true
    },
    "plugins": [
        new CleanWebpackPlugin({
            "cleanAfterEveryBuildPatterns": ["!manifest.json", "!img/**"]
        }),
        new webpack.NamedModulesPlugin()
    ]
});
