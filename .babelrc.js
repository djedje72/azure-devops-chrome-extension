module.exports = {
    "plugins": [
        "angularjs-annotate",
        "@babel/transform-runtime",
        "@babel/plugin-proposal-class-properties"
    ],
    "presets": [
        ["@babel/preset-modules"]
    ],
    "ignore": [/node_modules/]
};
