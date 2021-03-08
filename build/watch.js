var watch = require('watch');
const _build = require('./build-export');
var path = require('path');

let timer;
const build = () => {
    if (timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(() => {
        _build();
    }, 500);
}

watch.watchTree(path.resolve(__dirname, '../packages'), function (f, curr, prev) {
    if (typeof f == "object" && prev === null && curr === null) {
    } else {
        build();
    }
})
