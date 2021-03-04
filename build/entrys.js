const path = require('path');
const resolveFile = fileName => path.resolve(__dirname, `../packages${fileName}`);
const formats = ['cjs', 'esm'];
const convertOptions = (options, format, p) => {
    let res;
    if (options.packageName) {
        res = {
            packageName: options.packageName,
            input: {
                input: options.input || resolveFile(`/${options.packageName}/index.ts`)
            },
            output: {
                format,
                file: options.output || resolveFile(`/${options.packageName}/dist/index.${format}.js`),
            }
        }
    } else {
        res = {
            packageName: p.packageName,
            input: typeof options.input === 'object' ? options.input : {
                input: options.input
            },
            output: Object.assign({
                format,
                file: typeof options.output === 'object' ? options.output.file : options.output
            }, typeof options.output === 'object' ? options.output : {}),
            options
        }
    }
    if (res.output.format === 'umd' && !res.output.name) {
        const name = cssStyle2DomStyle(res.packageName);
        res.output.name = `MpKit${name[0].toUpperCase()}${name.substr(1)}`;
    }
    return res;
}
function cssStyle2DomStyle(sName) {
    return sName.replace(/^\-/, '').replace(/\-(\w)(\w+)/g, function (a, b, c) {
        return b.toUpperCase() + c.toLowerCase();
    });
}
module.exports = [
    'core',
    'provider',
    'renderer',
    'types',
    'util',
].reduce((sum, package) => {
    package = typeof package === 'object' ? package : {
        packageName: package
    }
    if (!package.formats) {
        package.formats = [...formats];
    }
    package.formats.forEach((format, index) => {
        if (package.entrys) {
            package.entrys.forEach(options => {
                sum.push(convertOptions(options, format, package));
            })
        } else {
            sum.push(convertOptions(package, format, package));
        }
    });
    return sum;
}, [])