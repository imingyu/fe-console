var watch = require('watch');
var path = require('path');

const build = require('./build.js');
build();

watch.watchTree(path.resolve(__dirname, '../src'), function (f, curr, prev) {
    if (typeof f == "object" && prev === null && curr === null) {
    } else {
        build('dev');
    }
})
