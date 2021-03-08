const { existsSync, rmdir } = require('fs');
const path = require('path');
const { replaceDir, rmDir } = require('./fs');
const fse = require('fse');
const dir = path.resolve(__dirname, '../demo/fe-console');
replaceDir(path.resolve(__dirname, '../packages/mp-wechat/dist/npm'), dir);

['core', 'provider', 'renderer', 'types', 'util'].forEach(pack => {
    const name = `@fe-console/${pack}`;
    const packRoot = path.resolve(__dirname, `../packages/${pack}`);
    const nodeModulesDir = path.resolve(__dirname, '../demo/node_modules');
    fse.copyFileSync(path.join(packRoot, 'package.json'), path.join(nodeModulesDir, name, 'package.json'));
    replaceDir(path.join(packRoot, 'dist'), path.join(nodeModulesDir, name, 'dist'));
});

['set-data', 'util', 'types', 'mixin'].forEach(pack => {
    const name = `@mpkit/${pack}`;
    const packRoot = path.resolve(__dirname, `../node_modules/@mpkit/${pack}`);
    const nodeModulesDir = path.resolve(__dirname, '../demo/node_modules');
    fse.copyFileSync(path.join(packRoot, 'package.json'), path.join(nodeModulesDir, name, 'package.json'));
    replaceDir(path.join(packRoot, 'dist'), path.join(nodeModulesDir, name, 'dist'));
});

['forgiving-xml-parser', 'squirrel-report'].forEach(name => {
    const packRoot = path.resolve(__dirname, `../node_modules/${name}`);
    const nodeModulesDir = path.resolve(__dirname, '../demo/node_modules');
    if (name !== 'squirrel-report') {
        fse.copyFileSync(path.join(packRoot, 'package.json'), path.join(nodeModulesDir, name, 'package.json'));
        replaceDir(path.join(packRoot, 'dist'), path.join(nodeModulesDir, name, 'dist'));
    } else {
        fse.copyFileSync(path.join(packRoot, 'package.json'), path.join(nodeModulesDir, name, 'package.json'));
        fse.copyFileSync(path.join(packRoot, 'index.js'), path.join(nodeModulesDir, name, 'index.js'));
    }
});