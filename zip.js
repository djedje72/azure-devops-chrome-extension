const path = require("path");
const zipdir = require('zip-dir');

const suffixName = process.env.BROWSER === "gecko" ? ".gecko" : "";

zipdir(path.resolve(__dirname, "dist"), { saveTo: path.resolve(__dirname, `./extension${suffixName}.zip`) }, () => {});