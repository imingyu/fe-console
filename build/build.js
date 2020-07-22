const fs = require('fs');
const buildSass = require('./sass');
const fse = require('fs-extra');
const path = require('path');
const ts = require('typescript');


const buildTs = (fileName, outputFileName) => {
    const source = fs.readFileSync(fileName, 'utf-8');
    const output = ts.transpile(source, {
        module: 'ES6'
    });
    fs.writeFileSync(outputFileName || fileName.replace('src', 'dist').replace('.ts','.js'), output, 'utf8');
}


const resolve = file => path.resolve(__dirname, `../src/${file}`);

const files = [
    resolve('index.ts'),
    resolve('rewrite.ts'),
    resolve('storage.ts'),
    resolve('util.ts')
];
const buildXml = (xmlFileName, mpSpec) => {
    let source = fs.readFileSync(xmlFileName, 'utf-8');
    source = source.replace(/:mpc:/gm, mpSpec.expTag);
    source = source.replace(/@mpc:/gm, mpSpec.expEvent);
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
    resolve('mp-console/tpl-view.xml')
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

fs.mkdirSync(path.resolve(__dirname, `../dist`));
files.forEach(item => buildTs(item));
[{
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
}].forEach(spec => {
    buildMP(spec);
})