const { nodeResolve } = require('@rollup/plugin-node-resolve');
const { babel } = require('@rollup/plugin-babel');
let { version } = require('../lerna.json');
const rollupCommonjs = require('@rollup/plugin-commonjs');
const rollupReplace = require('@rollup/plugin-replace');
const rollupJSON = require('@rollup/plugin-json');
const path = require('path');
const fs = require('fs');
const fse = require('fse');
const rollup = require('rollup');
const entrys = require('./entrys');
const rollupTS = require('@rollup/plugin-typescript')
const { replaceFileContent, oneByOne } = require('./util');
const getPackageName = (str) => {
    return (str || '').replace(path.resolve(__dirname, '../packages'), '');
}
console.log(`version=${version}, ${typeof version}`);
version = version.split('.');
version[version.length - 1] = parseInt(version[version.length - 1]) + 1;
version = version.join('.');

console.log(`🌟开始编译...`);

oneByOne(entrys.map((rollupConfig, index) => {
    return () => {
        // 将所有的d.ts移到types目录下
        const arr = rollupConfig.input.input.split('/');
        arr.splice(arr.length - 1, 1);
        const packageRoot = arr.join('/');
        const typesOutDir = packageRoot + '/spec';
        fs.readdirSync(packageRoot).forEach(srcFile => {
            if (srcFile.endsWith('.d.ts') && !srcFile.endsWith('global.d.ts') && !srcFile.endsWith('name.d.ts')) {
                const targetFileName = path.join(typesOutDir, srcFile);
                const sourceFileName = path.join(packageRoot, srcFile);
                fse.copyFileSync(sourceFileName, targetFileName);
                fs.unlinkSync(sourceFileName);
                replaceFileContent(targetFileName, /\.\.\/types/, '@mpkit/types');
            }
        })
        if (!rollupConfig.input.external) {
            rollupConfig.input.external = [/\@mpkit\//]
        }
        rollupConfig.input.external.push(/lodash/);
        rollupConfig.input.external.push('fast-xml-parser');
        if (!rollupConfig.input.plugins) {
            rollupConfig.input.plugins = [];
        }
        rollupConfig.input.plugins.push(nodeResolve());
        rollupConfig.input.plugins.push(rollupReplace({
            VERSION: version
        }));
        rollupConfig.input.plugins.push(rollupCommonjs());
        rollupConfig.input.plugins.push(rollupJSON());
        rollupConfig.input.plugins.push(rollupTS({
            declaration: false
        }));
        rollupConfig.input.plugins.push(babel({
            extensions: ['.ts', '.js'],
            babelHelpers: 'bundled',
            include: [
                'packages/**/*.ts'
            ],
            exclude: [
                'node_modules'
            ],
            extends: path.resolve(__dirname, '../.babelrc')
        }));
        const packageName = getPackageName(rollupConfig.output.file);
        rollupConfig.output.sourcemap = true;
        //         rollupConfig.output.banner = `/*!
        // * MpKit v${version}
        // * (c) 2020-${new Date().getFullYear()} imingyu<mingyuhisoft@163.com>
        // * Released under the MIT License.
        // * Github: https://github.com/imingyu/mpkit
        // */`;
        return rollup.rollup(rollupConfig.input).then(res => {
            return res.write(rollupConfig.output);
        }).then(() => {
            return new Promise((resolve) => {
                setTimeout(() => {
                    rollupConfig.options && rollupConfig.options.done && rollupConfig.options.done();
                    resolve();
                })
            })
        }).then(() => {
            console.log(`   编译成功：${packageName}`);
        })
    }
})).then(() => {
    console.log(`🌈编译结束.`);
}).catch(err => {
    console.error(`🔥编译出错：${err.message}`);
    console.log(err);
});

// const ebus = require('../packages/ebus');
// ebus.on()