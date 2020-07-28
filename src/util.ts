export interface EachHandler<T> {
    (value: T, prop: number | string): void;
}
export type IMap<P, T> = {
    P: T;
};
export const toString = Object.prototype.toString;
export const isArray =
    "isArray" in Array
        ? Array.isArray
        : (obj: any): boolean => toString.call(obj) === "[object Array]";
export const each = <T>(list: Array<T> | object, hander: EachHandler<T>) => {
    const type = typeof list;
    if (isArray(list)) {
        const arr: Array<T> = list as Array<T>;
        for (let i = 0, len = arr.length; i < len; i++) {
            hander(arr[i], i);
        }
    } else if (type === "object") {
        const obj: object = list as object;
        for (let prop in obj) {
            hander(list[prop], prop);
        }
    }
};

export const rewrite = (targetMP: object, hander: EachHandler<any>) => {
    const result = {};
    each(targetMP, (value, prop) => {
        if (typeof value === "function") {
            result[prop] = hander(value, prop);
        } else {
            result[prop] = value;
        }
    });
    return result;
};

export const uuid = () => {
    return "xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx".replace(/[xy]/g, function (c) {
        // tslint:disable-next-line:no-bitwise
        var r = (Math.random() * 16) | 0;
        // tslint:disable-next-line:no-bitwise
        var v = c === "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
};
export const getViewLabel = (vm, viewType) => {
    return viewType === "App"
        ? "app"
        : vm
        ? vm.route || vm.__route__ || vm.is
        : "";
};

export function isPlainObject(value) {
    if (typeof value !== "object") {
        return false;
    }
    if (Object.getPrototypeOf(value) === null) {
        return true;
    }
    let proto = value;
    while (Object.getPrototypeOf(proto) !== null) {
        proto = Object.getPrototypeOf(proto);
    }
    return Object.getPrototypeOf(value) === proto;
}
