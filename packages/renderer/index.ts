import {
    FcRendererLevel,
    FcRendererProduct,
    FcRendererType,
} from "@fe-console/types";

const simpleTypes = {
    number: 1,
    string: 2,
    boolean: 3,
    undefined: 7,
    symbol: 9,
    bigint: 24,
    // null: 8,
};
const simpleRender = (
    obj: any,
    type: string,
    addr: string = "",
    maxLength: number = -1
): FcRendererProduct[] => {
    const res: FcRendererProduct[] = [];
    let item: FcRendererProduct;
    if (simpleTypes[type]) {
        const tsObj = obj + "";
        item = {
            type: simpleTypes[type],
            value: tsObj,
        };
        if (type === "undefined") {
            delete item.value;
        }
        if (type === "symbol") {
            item.value = item.value.toString();
        }
        if (addr) {
            item.addr = addr;
        }
        res.push(item);
        if (maxLength !== -1 && tsObj.length > maxLength) {
            item.value = item.value.substr(0, maxLength);
            res.push({
                type: FcRendererType.ellipsis,
            });
        }
    }
    if (obj === null) {
        item = {
            type: FcRendererType.null,
        };
        res.push(item);
    }
    if (item && addr) {
        item.addr = addr;
    }
    return res;
};

export const renderFunc = (
    func: Function,
    addr: string = "",
    list: FcRendererProduct[] = [],
    maxLength: number = -1,
    ellipsisLevel: FcRendererLevel = 0
): FcRendererProduct[] => {
    return list;
};

export const renderDate = (
    dt: Date,
    addr: string = "",
    list: FcRendererProduct[] = [],
    maxLength: number = -1,
    ellipsisLevel: FcRendererLevel = 0
): FcRendererProduct[] => {
    return list;
};

export const renderRegExp = (
    dt: RegExp,
    addr: string = "",
    list: FcRendererProduct[] = [],
    maxLength: number = -1,
    ellipsisLevel: FcRendererLevel = 0
): FcRendererProduct[] => {
    return list;
};

export const render = (
    obj: any,
    addr: string = "",
    maxLength: number = -1
): FcRendererProduct[] => {
    const type = typeof obj;
    const res: FcRendererProduct[] = simpleRender(obj, type, addr, maxLength);
    if (res.length) {
        return res;
    }
    if (type === "function") {
        return renderFunc(
            obj as Function,
            addr,
            res,
            maxLength,
            FcRendererLevel.detail
        );
    }
    // if (obj instanceof Date) {
    //     return renderDate(obj as Date, addr, res, maxLength, ellipsisLevel);
    // }
    // if (obj instanceof RegExp) {
    //     return renderRegExp(obj as RegExp, addr, res, maxLength, ellipsisLevel);
    // }
    return res;
};
