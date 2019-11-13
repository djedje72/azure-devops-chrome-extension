const path = require("path");
const zipdir = require('zip-dir');

zipdir(path.resolve(__dirname, "dist"), { saveTo: path.resolve(__dirname, "./Chrome extension.zip") }, () => {});