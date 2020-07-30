import {
    MpPlatfrom,
    MpViewType,
    MpAlipayViewComponent,
    MpTiktokView,
    MpViewLike,
    MpWechatView,
    MpAlipayViewPage,
    MpSmartViewPage,
    MpSmartViewComponent,
    MpViewElementSpec,
    MpViewComponentSpec,
} from "./vars";
import { DataViewType, DataViewLike } from "./viewer";
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

export const rewrite = (target: object, hander: EachHandler<any>) => {
    const result = {};
    each(target, (value, prop) => {
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

export const getMpPlatformName = (): MpPlatfrom => {
    if (typeof wx === "object") {
        return MpPlatfrom.wechat;
    } else if (typeof my === "object") {
        return MpPlatfrom.alipay;
    } else if (typeof swan === "object") {
        return MpPlatfrom.smart;
    } else if (typeof tt === "object") {
        return MpPlatfrom.tiktok;
    } else {
        return MpPlatfrom.unknown;
    }
};
export const getMpPlatformApiVar = (): any => {
    if (typeof wx === "object") {
        return wx;
    } else if (typeof my === "object") {
        return my;
    } else if (typeof swan === "object") {
        return swan;
    } else if (typeof tt === "object") {
        return tt;
    } else {
        return undefined;
    }
};
export const MP_API_VAR = getMpPlatformApiVar();
export const MP_PLATFORM: MpPlatfrom = getMpPlatformName();

export const getMpNativeViewId = (
    vm: MpViewLike,
    viewType: MpViewType
): string => {
    if (MP_PLATFORM === MpPlatfrom.unknown) {
        return "unknown";
    }
    if (viewType === MpViewType.App) {
        return "app";
    }
    if (viewType === MpViewType.Page) {
        if (MP_PLATFORM === MpPlatfrom.wechat) {
            return (vm as MpWechatView).__wxWebviewId__ + "";
        }
        if (MP_PLATFORM === MpPlatfrom.alipay) {
            return (vm as MpAlipayViewPage).$viewId;
        }
        if (MP_PLATFORM === MpPlatfrom.tiktok) {
            return (vm as MpTiktokView).__webviewId__ + "";
        }
        if (MP_PLATFORM === MpPlatfrom.smart) {
            return (vm as MpSmartViewPage).$mpcId;
        }
    }
    if (viewType === MpViewType.Component) {
        if (MP_PLATFORM === MpPlatfrom.wechat) {
            return (vm as MpWechatView).__wxExparserNodeId__;
        }
        if (MP_PLATFORM === MpPlatfrom.alipay) {
            return (vm as MpAlipayViewComponent).$id + "";
        }
        if (MP_PLATFORM === MpPlatfrom.tiktok) {
            return (vm as MpTiktokView).__nodeId__ + "";
        }
        if (MP_PLATFORM === MpPlatfrom.smart) {
            return (vm as MpSmartViewComponent).nodeId;
        }
    }
};
export const getMpComponentPageNativeViewId = (vm: MpViewLike): string => {
    if (MP_PLATFORM === MpPlatfrom.wechat) {
        return (vm as MpWechatView).__wxWebviewId__ + "";
    }
    if (MP_PLATFORM === MpPlatfrom.alipay) {
        return (vm as MpAlipayViewComponent).$page.$id + "";
    }
    if (MP_PLATFORM === MpPlatfrom.tiktok) {
        return (vm as MpTiktokView).__webviewId__ + "";
    }
    if (MP_PLATFORM === MpPlatfrom.smart) {
        return (vm as MpSmartViewComponent).pageinstance.$mpcId;
    }
};
export const getMpViewPathName = (
    viewType: MpViewType,
    vm?: MpViewLike
): string => {
    if (viewType === MpViewType.App) {
        return "app";
    }
    if (!vm) {
        return "";
    }
    if (MP_PLATFORM === MpPlatfrom.wechat) {
        return (vm as MpWechatView).is;
    }
    if (MP_PLATFORM === MpPlatfrom.alipay) {
        if (viewType === MpViewType.Page) {
            return (vm as MpAlipayViewPage).route;
        }
        return (vm as MpAlipayViewComponent).is;
    }
    if (MP_PLATFORM === MpPlatfrom.tiktok) {
        return (vm as MpTiktokView).is;
    }
    if (MP_PLATFORM === MpPlatfrom.smart) {
        if (viewType === MpViewType.Page) {
            return (vm as MpSmartViewPage).route;
        }
        return (vm as MpSmartViewComponent).is;
    }
};

export const getMpViewChildren = (vm: MpViewLike) => {
};

export const getMpViewElementSpec = (
    vm: MpViewLike,
    viewType: MpViewType
): MpViewElementSpec => {
    const spec: MpViewElementSpec = {
        key: viewType === MpViewType.App ? "app" : vm.$mpcId,
    } as MpViewElementSpec;
    if (viewType === MpViewType.App) {
        spec.tag = "App";
    } else if (viewType === MpViewType.Page) {
        spec.tag = "Page";
        const tsVm = vm as MpWechatView & MpAlipayViewPage & MpTiktokView;
        spec.is = tsVm.is || tsVm.route;
    } else {
        if (
            MP_PLATFORM === MpPlatfrom.wechat ||
            MP_PLATFORM === MpPlatfrom.tiktok
        ) {
            spec.tag = "Component";
            spec.is = (vm as MpWechatView & MpTiktokView).is;
        } else if (MP_PLATFORM === MpPlatfrom.alipay) {
            spec.tag = (vm as MpAlipayViewComponent).props.__tag;
            spec.is = (vm as MpAlipayViewComponent).is;
        } else if (MP_PLATFORM === MpPlatfrom.smart) {
            spec.tag = (vm as MpSmartViewComponent).componentName;
            spec.is = (vm as MpSmartViewComponent).is;
        }
        const tsViewSpec = vm.$viewSpec as MpViewComponentSpec;
        if (tsViewSpec.properties) {
            const attrs = [] as DataViewLike[];
            each(tsViewSpec.properties, (propSpec, prop) => {
                const value =
                    vm[
                        `${
                            MP_PLATFORM === MpPlatfrom.alipay ? "props" : "data"
                        }`
                    ][prop];
                const dataType = typeof value;
                if (isArray(value)) {
                    spec.attrs.push({
                        name: prop,
                        type: DataViewType.array,
                        length: (value as any).length,
                    } as DataViewLike);
                } else if (dataType == "object") {
                    spec.attrs.push({
                        name: prop,
                        type: DataViewType.object,
                        value: value === null ? "null" : "{...}",
                    } as DataViewLike);
                } else if (dataType === "string") {
                    spec.attrs.push({
                        name: prop,
                        type: DataViewType.string,
                        value,
                    } as DataViewLike);
                } else if (dataType === "symbol") {
                    spec.attrs.push({
                        name: prop,
                        type: DataViewType.symbol,
                        value: value.toString(),
                    } as DataViewLike);
                } else if (dataType === "function") {
                    spec.attrs.push({
                        name: prop,
                        type: DataViewType.function,
                    } as DataViewLike);
                } else if (dataType !== "undefined") {
                    spec.attrs.push({
                        name: prop,
                        type: DataViewType[prop],
                        value,
                    } as DataViewLike);
                }
            });
            if (attrs.length) {
                spec.attrs = attrs;
            }
        }
    }
    return spec;
};

export const isEmptyObject = (obj) => {
    for (let prop in obj) {
        return false;
    }
    return true;
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
