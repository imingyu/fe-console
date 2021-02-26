const { parseData } = require('./dist/index.cjs');
const res = parseData('chunk', '你好', [1, 2, 3, { name: 'Tom' }, () => 33], { name: 'Alice', address: { name: '上海' } });
console.log(res);