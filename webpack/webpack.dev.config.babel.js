import webpack from "webpack";
import path from "path";
import merge from "webpack-merge";

import devServer from "./webpack.devserver";
import webpackCommon from "./webpack.common.config";

export default merge(webpackCommon, {
    "mode": "development",
    "devtool": "source-map",
    devServer
});
