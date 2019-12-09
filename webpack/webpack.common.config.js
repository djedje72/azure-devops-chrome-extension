import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import webpack from "webpack";

const indexEntryChunks = ["assets", "main"];
const backgroundEntryChunks = ["assets", "install", "main"];
const root = path.resolve(__dirname, "..");
export default {
    "mode": "production",
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
        new CopyPlugin([
            { from: "manifest.json", to: "manifest.json" },
            { from: "img/icon/**.*" },
        ]),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ]
};