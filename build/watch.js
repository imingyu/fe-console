var watch = require('watch');
const _build = require('./build-export');
var path = require('path');

let timer;
let running;
let queue = [];
const build = () => {
    if (running) {
        queue.push(1);
        return;
    }
    if (timer) {
        clearTimeout(timer);
    }
    timer = setTimeout(() => {
        console.log('开始编译');
        running = true;
        _build().then(() => {
            running = false;
            if (queue.length) {
                queue = [];
                build();
            }
        }).catch(() => {
            running = false;
            if (queue.length) {
                queue = [];
                build();
            }
        })
    }, 500);
}

watch.watchTree(path.resolve(__dirname, '../packages'), function (f, curr, prev) {
    if (typeof f == "object" && prev === null && curr === null) {
    } else {
        build();
    }
})
