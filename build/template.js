const path = require('path');
const fs = require('fs');
const { template, templateSettings } = require('lodash');
const junk = require('junk');
const { replaceDir, rmDir, readFile, writeFile, removeFile } = require('./fs');
const packagesRoot = path.resolve(__dirname, '../packages');
const templatePackRoot = path.join(packagesRoot, 'template');;
const templateSourceDir = path.join(templatePackRoot, 'mp');
const MpXmlTranslator = require('@mpkit/mpxml-translator');
const MpXmlParser = require('@mpkit/mpxml-parser');
const renderSass = require('./sass');
templateSettings.interpolate = /<%=([\s\S]+?)%>/g;

const platformMap = {
    wechat: '微信',
    alipay: '支付宝',
    smart: '百度',
    tiktok: '字节跳动'
}

const cssFileSuffixMap = {
    wechat: '.wxss',
    alipay: '.acss',
    smart: '.css',
    tiktok: '.ttss'
}

const compiledTpls = {};

const renderPackage = (platform) => {
    return new Promise((resolve, reject) => {
        const packRoot = path.join(packagesRoot, `mp-${platform}`);
        const tplDir = path.join(packRoot, 'tpl');
        replaceDir(templateSourceDir, packRoot);
        const spec = MpXmlParser.mpViewSyntaxSpec[platform];
        writeFile(path.join(packRoot, 'platform.js'), `module.exports = ${JSON.stringify(spec, null, 4)}`);
        const renderData = {
            platform,
            platformText: platformMap[platform],
            MethodExecStatus0: 'Unknown',
            MethodExecStatus1: 'Executed',
            MethodExecStatus2: 'Success',
            MethodExecStatus3: 'Fail',
            catchEvent(eventName) {
                if (platform === 'alipay') {
                    return `catch${eventName[0].toUpperCase()}${eventName.substr(1)}`;
                }
                return `catch${eventName}`;
            },
            bindEvent(eventName) {
                if (platform === 'alipay') {
                    return `on${eventName[0].toUpperCase()}${eventName.substr(1)}`;
                }
                return `bind${eventName}`;
            }
        }
        fs.readdirSync(tplDir).forEach(item => {
            const fileName = path.join(tplDir, item);
            if (junk.is(item) || !fileName.endsWith('.wxml')) {
                return;
            }
            const orgFileName = fileName.replace(packRoot, templatePackRoot);
            if (!compiledTpls[orgFileName]) {
                compiledTpls[orgFileName] = template(readFile(fileName));
            }
            const tplName = item.substr(0, item.lastIndexOf('.')).split('_')[1];
            renderData[tplName] = compiledTpls[orgFileName](renderData);
        });
        rmDir(tplDir);
        renderTemplate(platform, packRoot, renderData).then(resolve).catch(reject);
    })
}

const renderFile = (platform, fileName, renderData) => {
    return new Promise((resolve, reject) => {
        const packRoot = path.join(packagesRoot, `mp-${platform}`);
        const isXml = fileName.endsWith('.wxml');
        const isScss = fileName.endsWith('.scss');
        if (isXml || fileName.endsWith('.json') || isScss || fileName.endsWith('.ts') || fileName.endsWith('.js')) {
            const orgFileName = fileName.replace(packRoot, templatePackRoot);
            if (!compiledTpls[orgFileName]) {
                compiledTpls[orgFileName] = template(readFile(fileName));
            }
            const newContent = compiledTpls[orgFileName](renderData);
            if ((!isXml && !isScss) || !newContent) {
                writeFile(fileName, newContent);
                return resolve();
            }
            const spec = MpXmlParser.mpViewSyntaxSpec[platform];
            if (isScss) {
                writeFile(fileName, newContent);
                renderSass(fileName).then((cssContent) => {
                    writeFile(fileName.substr(0, fileName.lastIndexOf('.')) + (spec.cssFileSuffix || cssFileSuffixMap[platform]), cssContent);
                    resolve();
                }).catch(reject);
                return;
            }
            try {
                writeFile(fileName, MpXmlTranslator.translateXml(newContent, 'wechat', platform, {
                    allowStartTagBoundaryNearSpace(
                        xml,
                        cursor
                    ) {
                        return 'right';
                    },
                }));
                if (!fileName.endsWith(spec.xmlFileSuffix)) {
                    fs.renameSync(fileName, fileName.substr(0, fileName.lastIndexOf('.')) + spec.xmlFileSuffix);
                }
                resolve();
            } catch (error) {
                error.fileName = fileName;
                reject(error);
            }
        }
    })
}


const renderTemplate = (platform, dir, renderData) => {
    return Promise.all(fs.readdirSync(dir).map(item => {
        if (junk.is(item)) {
            return Promise.resolve();
        }
        const fileName = path.join(dir, item);
        const stat = fs.statSync(fileName);
        if (stat.isFile()) {
            renderFile(platform, fileName, renderData);
        } else if (stat.isDirectory()) {
            return renderTemplate(platform, fileName, renderData);
        } else {
            return Promise.resolve();
        }
    }));
}

exports.renderPackage = renderPackage;
exports.platformMap = platformMap;