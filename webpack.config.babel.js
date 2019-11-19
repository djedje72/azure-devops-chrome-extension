let webpackConfig;

switch (process.env.NODE_ENV) {
    case "production":
        webpackConfig = require("./webpack/webpack.production.config.babel");
        break;
    case "development":
    default:
        webpackConfig = require("./webpack/webpack.dev.config.babel");
}

module.exports = webpackConfig.default;
