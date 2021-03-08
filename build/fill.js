const path = require('path');
const fs = require('fs');
const fse = require('fse');
const junk = require("junk");
const { removeFile, mkDir } = require('./fs');
const platform = process.argv[2];
if (!platform) {
    throw new Error('请传递平台');
}

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