module.exports = {
    "plugins": [
        "angularjs-annotate",
        "@babel/transform-runtime",
        "@babel/plugin-proposal-class-properties"
    ],
    "presets": [
        ["@babel/preset-env"]
    ],
    "ignore": [/node_modules/]
};
