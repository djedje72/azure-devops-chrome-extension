import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import CleanWebpackPlugin from "clean-webpack-plugin";

const indexEntryChunks = ["assets", "main"];
const backgroundEntryChunks = ["assets", "install", "main"];
const root = path.resolve(__dirname);
export default {
    "mode": "production",
    "devtool": "source-map",
    "resolve": {
        "alias": {
            "member": `${root}/member`
        }
    },
    "entry": {
        "main": "./index",
        "install": "./scripts/install",
        "assets": path.resolve(root, "assets")
    },
    "output": {
        path: path.resolve(root, "dist"),
        filename: "[name].[contenthash].js"
    },
    "module": {
        "rules": [
            {
                "test": /\.js$/,
                "exclude": [path.resolve(root, "node_modules")],
                "use": [
                    {
                        "loader": "babel-loader",
                        "options": {"cacheDirectory": true}
                    }
                ]
            },
            {
                "test": /\.css$/,
                "use": [
                    MiniCssExtractPlugin.loader,
                    "css-loader"
                ]
            },
            {
                "test": /\.html$/,
                "loader": "html-loader",
                "options": {
                    "interpolate": true
                }
            },
            {
                "test": /\.(gif|png|svg|woff|woff2|eot|ttf)$/,
                "loader": "file-loader"
            }
        ]
    },
    "plugins": [
        new CleanWebpackPlugin(),
        new HtmlWebpackPlugin({
            "inject": "head",
            "filename": "index.html",
            "template": path.resolve(root, "index.html"),
            "chunks": indexEntryChunks,
            "chunksSortMode": (a, b) => indexEntryChunks.indexOf(a.names[0]) - indexEntryChunks.indexOf(b.names[0]),
        }),
        new HtmlWebpackPlugin({
            "inject": "head",
            "filename": "background.html",
            "template": path.resolve(root, "background.html"),
            "chunks": backgroundEntryChunks,
            "chunksSortMode": (a, b) => backgroundEntryChunks.indexOf(a.names[0]) - backgroundEntryChunks.indexOf(b.names[0]),
        }),
        new MiniCssExtractPlugin({
            "filename": "[name].[contenthash].css"
        }),
        new CopyPlugin([
            { from: "manifest.json", to: "manifest.json" },
            { from: "img/icon/**.*" },
        ]),
    ]
};