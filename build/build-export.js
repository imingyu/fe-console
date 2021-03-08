const rollup = require('./rollup');
const { renderPackage, platformMap } = require('./template');
const { fillDemo, fillMpPack } = require('./pack');

module.exports = () => {
    return rollup().then(() => {
        return Promise.all(Object.keys(platformMap).map(platform => {
            return renderPackage(platform).then(() => {
                return fillMpPack(platform)
            }).then(() => {
                if (platform === 'wechat') {
                    return fillDemo();
                }
            })
        }))
    })
}