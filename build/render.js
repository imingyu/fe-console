const { renderPackage } = require('./template');
const platform = process.argv[2];
if (!platform) {
    throw new Error('请传递平台');
}
console.log(`开始渲染${platform}的文件`);
renderPackage(platform).then(() => {
    console.log(`成功渲染${platform}的文件`);
}).catch(err => {
    console.log(`渲染${platform}的文件异常：${err.message}`);
    console.error(err);
})