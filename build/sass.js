const sass = require('node-sass');
const autoprefixer = require('autoprefixer');
const postcss = require('postcss');
module.exports = (filePath) => {
    return new Promise((resolve, reject) => {
        var res = !filePath ? '' : sass.renderSync({
            file: filePath,
            outputStyle: 'expanded'
        }).css;
        if (res) {
            postcss([autoprefixer]).process(res).then(result => {
                resolve(result.css)
            }).catch(err => {
                reject(err)
            })
        } else {
            resolve(res)
        }
    })
}
