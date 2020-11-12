import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";
import CopyPlugin from "copy-webpack-plugin";
import webpack from "webpack";
import { Buffer } from "buffer";
import _ from "lodash";

const indexEntryChunks = ["assets", "main"];
const backgroundEntryChunks = ["assets", "install", "background"];
const root = path.resolve(__dirname, "..");
const src = path.resolve(__dirname, "../src");
export default {
    "entry": {
        "main": path.resolve(src, "index"),
        "background": path.resolve(src, "background"),
        "install": path.resolve(root, "scripts/install"),
        "assets": path.resolve(src, "assets")
    },
    "mode": "production",
    "module": {
        "rules": [{
                "test": /\.js$/,
                "exclude": [path.resolve(root, "node_modules")],
                "use": [{
                    "loader": "babel-loader",
                    "options": { "cacheDirectory": true }
                }]
            },
            {
                "test": /\.html$/,
                "loader": "html-loader"
            },
            {
                "test": /\.(gif|png|svg|woff|woff2|eot|ttf)$/,
                "loader": "file-loader"
            }
        ]
    },
    "output": {
        path: path.resolve(root, "dist"),
        filename: "[name].[contenthash].js",
        publicPath: "/"
    },
    "plugins": [
        new HtmlWebpackPlugin({
            "inject": "head",
            "filename": "index.html",
            "template": path.resolve(src, "index.html"),
            "chunks": indexEntryChunks,
            "chunksSortMode": "manual"
        }),
        new HtmlWebpackPlugin({
            "inject": "head",
            "filename": "background.html",
            "template": path.resolve(src, "background.html"),
            "chunks": backgroundEntryChunks,
            "chunksSortMode": "manual"
        }),
        new CopyPlugin({
            "patterns": [
                {
                    from: "manifest.json",
                    to: "manifest.json",
                    transform: (manifestBuffer) => {
                        if (process.env.BROWSER === "gecko") {
                            const manifest = JSON.parse(manifestBuffer.toString());
                            const geckoManifest = _.merge({}, manifest, require(`${root}/manifest.gecko.json`));
                            return Buffer.from(JSON.stringify(geckoManifest));
                        }
                        return manifestBuffer;
                    }
                },
                {
                    from: "img/icon/**.*"
                },
            ]
        }),
        new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
    ],
    "resolve": {
        "alias": {
            "index": `${src}/index`,
            "member": `${src}/member`,
            "settings": `${src}/settings`
        }
    }
};