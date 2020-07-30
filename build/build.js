const fs = require('fs');
const buildSass = require('./sass');
const rimraf = require('rimraf');
const fse = require('fs-extra');
const path = require('path');
const ts = require('typescript');
const copyDir = require('./copy');

const buildTs = (fileName, outputFileName) => {
    const source = fs.readFileSync(fileName, 'utf-8');
    const output = ts.transpile(source, {
        module: 'ES6'
    });
    fs.writeFileSync(outputFileName || fileName.replace('src', 'dist').replace('.ts', '.js'), output, 'utf8');
}

const resolve = file => path.resolve(__dirname, `../src/${file}`);

const files = [
    resolve('config.ts'),
    resolve('index.ts'),
    resolve('rewrite.ts'),
    resolve('storage.ts'),
    resolve('viewer.ts'),
    resolve('vars.ts'),
    resolve('util.ts')
];
const buildXml = (xmlFileName, mpSpec) => {
    let source = fs.readFileSync(xmlFileName, 'utf-8');
    source = source.replace(/:mpc:/gm, mpSpec.expTag);
    source = source.replace(/@mpc:/gm, mpSpec.expEvent);
    source = source.replace(/.mpc:xmlSuffix/gm, '.'+mpSpec.xmlSuffix);
    const arr = xmlFileName.split('/');
    const outputFileName = path.resolve(__dirname, `../dist/mpc-${mpSpec.name}/${arr[arr.length - 1].replace('.xml', '')}.${mpSpec.xmlSuffix}`);
    fs.writeFileSync(outputFileName, source, 'utf8');
}

const xmlFiles = [
    resolve('mp-console/index.xml'),
    resolve('mp-console/tpl-all.xml'),
    resolve('mp-console/tpl-console.xml'),
    resolve('mp-console/tpl-network.xml'),
    resolve('mp-console/tpl-storage.xml'),
    resolve('mp-console/tpl-system.xml'),
    resolve('mp-console/tpl-view.xml'),
    resolve('mp-console/viewer.xml')
]

const buildMP = (mpSpec) => {
    const outputPath = path.resolve(__dirname, `../dist/mpc-${mpSpec.name}`);
    const outSass = path.join(outputPath, 'index.scss');
    fs.mkdirSync(outputPath);
    fse.copySync(resolve('mp-console/index.json'), path.join(outputPath, 'index.json'));
    fse.copySync(resolve('mp-console/index.scss'), outSass);
    buildTs(resolve('mp-console/index.ts'), path.join(outputPath, 'index.js'));
    xmlFiles.forEach(xmlFileName => {
        buildXml(xmlFileName, mpSpec);
    });
    return buildSass(outSass).then(content => {
        fs.writeFileSync(path.join(outputPath, `index.${mpSpec.cssSuffix}`), content, 'utf8');
    })
}

module.exports = () => {
    console.log(`开始编译`);
    const distPath = path.resolve(__dirname, `../dist`);
    const demoPath = path.resolve(__dirname, `../demo/mp-console`);
    rimraf.sync(distPath);
    rimraf.sync(demoPath);
    fs.mkdirSync(path.resolve(__dirname, `../dist`));
    fs.mkdirSync(path.resolve(__dirname, `../demo/mp-console`));

    files.forEach(item => buildTs(item));
    Promise.all([{
        name: 'wechat',
        expTag: 'wx:',
        expEvent: 'bind:',
        cssSuffix: 'wxss',
        xmlSuffix: 'wxml'
    }, {
        name: 'alipay',
        expTag: 'a:',
        expEvent: 'bind:',
        cssSuffix: 'acss',
        xmlSuffix: 'axml'
    }, {
        name: 'smart',
        expTag: 'swan:',
        expEvent: 'bind:',
        cssSuffix: 'css',
        xmlSuffix: 'swan'
    }, {
        name: 'tiktok',
        expTag: 'tt:',
        expEvent: 'bind:',
        cssSuffix: 'ttss',
        xmlSuffix: 'ttml'
    }].map(spec => {
        return buildMP(spec);
    })).then(() => {
        copyDir(path.resolve(__dirname, `../dist`), path.resolve(__dirname, `../demo/mp-console`));
        console.log(`编译结束\n`);
    })
}
var args = process.argv.splice(2);
if (args.length) {
    module.exports()
};