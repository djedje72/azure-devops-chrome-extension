import MiniCssExtractPlugin from "mini-css-extract-plugin";
import path from "path";
import HtmlWebpackPlugin from "html-webpack-plugin";

const entryChunks = ["assets", "main"];
const root = path.resolve(__dirname, "..");
export default {
    "entry": {
        "main": "./index.js",
        "assets": path.resolve(root, "assets")
    },
    "output": {
        path: path.resolve(root, "dist"),
        filename: "[name].js"
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
        new HtmlWebpackPlugin({
            "inject": "head",
            "filename": "index.html",
            "template": path.resolve(root, "index.html"),
            "chunks": entryChunks,
            "chunksSortMode": (a, b) => entryChunks.indexOf(a.names[0]) - entryChunks.indexOf(b.names[0]),
        }),
        new MiniCssExtractPlugin({
            "filename": "[name].css"
        }),
    ]
};