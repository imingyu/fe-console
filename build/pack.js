const fs = require('fs');
const junk = require('junk');
const path = require('path');
const { replaceDir, mkDir, removeFile } = require('./fs');
const fse = require('fse');
exports.fillMpPack = (platform) => {
    const packRoot = path.resolve(__dirname, `../packages/mp-${platform}`);
    const fill = (src, target) => {
        mkDir(target);
        fs.readdirSync(src).forEach(item => {
            if (junk.is(item) || item === 'node_modules') {
                return;
            }
            const srcFile = path.join(src, item);
            if (srcFile === path.join(src, 'dist')) {
                return;
            }
            const targetFile = path.join(target, item);
            const stat = fs.statSync(srcFile);
            if (stat.isFile() && !srcFile.endsWith('tsconfig.json') && !srcFile.endsWith('.js') && !srcFile.endsWith('.ts') && !srcFile.endsWith('.scss')) {
                if (fs.existsSync(targetFile)) {
                    removeFile(targetFile);
                }
                fse.copyFileSync(srcFile, targetFile);
            }
            else if (stat.isDirectory() &&
                item !== ".git" &&
                item !== ".vscode") {
                fill(srcFile, targetFile);
            }
        })
    }

    fill(packRoot, path.join(packRoot, 'dist/npm'));
    return Promise.resolve();
}

exports.fillDemo = () => {
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
    return Promise.resolve();
}