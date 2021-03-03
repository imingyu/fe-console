const path = require('path');
const fs = require('fs');
const { template, templateSettings } = require('lodash');
const junk = require('junk');
const { replaceDir, rmDir, readFile, writeFile, removeFile } = require('./fs');
const packagesRoot = path.resolve(__dirname, '../packages');
const templatePackRoot = path.join(packagesRoot, 'template');;
const templateSourceDir = path.join(templatePackRoot, 'source');
const templateTplDir = path.join(templatePackRoot, 'tpl');
const MpXmlTranslator = require('@mpkit/mpxml-translator');
const MpXmlParser = require('@mpkit/mpxml-parser');
templateSettings.interpolate = /<%=([\s\S]+?)%>/g;

const platformMap = {
    wechat: '微信',
    alipay: '支付宝',
    smart: '百度',
    tiktok: '字节跳动'
}

const compiledTpls = {};

const renderPackage = (platform) => {
    const packRoot = path.join(packagesRoot, `mp-${platform}`);
    const srcDir = path.join(packRoot, 'src');
    const tplDir = path.join(packRoot, 'tpl');
    replaceDir(templateSourceDir, srcDir);
    replaceDir(templateTplDir, tplDir);
    const spec = MpXmlParser.mpViewSyntaxSpec[platform];
    writeFile(path.join(packRoot, 'platform.js'), `module.exports = ${JSON.stringify(spec, null, 4)}`);
    const renderData = {
        platform,
        platformText: platformMap[platform],
        MethodExecStatus0: 'Unknown',
        MethodExecStatus1: 'Executed',
        MethodExecStatus2: 'Success',
        MethodExecStatus3: 'Fail',
    }
    // {{data.status===1?'<%= MethodExecStatus1 %>':data.status===2?'<%= MethodExecStatus2 %>':data.status===3?'<%= MethodExecStatus3 %>':'<%= MethodExecStatus0 %>'}}
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
    renderTemplate(platform, srcDir, renderData);

    // 移动package.json
    writeFile(path.join(packRoot, 'package.json'), readFile(path.join(srcDir, 'package.json')));
    removeFile(path.join(srcDir, 'package.json'));
}

const renderTemplate = (platform, dir, renderData) => {
    const packRoot = path.join(packagesRoot, `mp-${platform}`);
    fs.readdirSync(dir).forEach(item => {
        if (junk.is(item)) {
            return;
        }
        const fileName = path.join(dir, item);
        const stat = fs.statSync(fileName);
        if (stat.isFile()) {
            // TODO:处理wxs等文件
            const isXml = fileName.endsWith('.wxml');
            if (isXml || fileName.endsWith('.json') || fileName.endsWith('.scss') || fileName.endsWith('.wxss') || fileName.endsWith('.ts') || fileName.endsWith('.js')) {
                const orgFileName = fileName.replace(packRoot, templatePackRoot);
                if (!compiledTpls[orgFileName]) {
                    compiledTpls[orgFileName] = template(readFile(fileName));
                }
                const newContent = compiledTpls[orgFileName](renderData);
                if (!isXml || !newContent) {
                    writeFile(fileName, newContent);
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
                    const spec = MpXmlParser.mpViewSyntaxSpec[platform];
                    if (!fileName.endsWith(spec.xmlFileSuffix)) {
                        fs.renameSync(fileName, fileName.substr(0, fileName.lastIndexOf('.')) + spec.xmlFileSuffix);
                    }
                } catch (error) {
                    error.fileName = fileName;
                    console.log(newContent)
                    console.error(error);
                }
            }
        } else if (stat.isDirectory()) {
            renderTemplate(platform, fileName, renderData);
        }
    });
}

for (let platform in platformMap) {
    renderPackage(platform);
}