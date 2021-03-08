const { fillMpPack } = require('./pack');
const platform = process.argv[2];
if (!platform) {
    throw new Error('请传递平台');
}

fillMpPack(platform);