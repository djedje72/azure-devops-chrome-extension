const path = require("path");
const zipdir = require('zip-dir');

const sep = path.sep;
const exclude = new RegExp(`(node_modules|dist|\.git)(\\${sep}|$)|\.(git[^.]*|zip|lock)$`);
zipdir(path.resolve(__dirname), {
    saveTo: path.resolve(__dirname, "./source.zip"),
    filter: (pathFile) => !exclude.test(path.resolve(pathFile))
}, () => {});