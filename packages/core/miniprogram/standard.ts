import {
    Fc,
    FcClientRect,
    FcStandardCallback,
    FcWindowSize,
} from "@fe-console/types";
import { MpPlatform } from "@mpkit/types";
import { getApiVar, getMpPlatform, uuid } from "@mpkit/util";

const callMpApi = (apiName: string, ...args) => {
    const api = getApiVar();
    if (!api) {
        console.warn(
            `无法在当前环境找到小程序Api对象，暂时无法执行${apiName}方法`
        );
        return;
    }
    if (!(apiName in api) || typeof api[apiName] !== "function") {
        console.warn(`无法小程序Api对象找到${apiName}方法`);
        return;
    }
    return api[apiName].apply(api, args);
};
const promiseifyMpApi = <T = any>(apiName: string, options?: any) => {
    const api = getApiVar();
    if (!api) {
        return Promise.reject(
            new Error(
                `无法在当前环境找到小程序Api对象，暂时无法执行${apiName}方法`
            )
        );
    }
    if (!(apiName in api) || typeof api[apiName] !== "function") {
        return Promise.reject(new Error(`无法小程序Api对象找到${apiName}方法`));
    }
    return new Promise((resolve, reject) => {
        if (!options) {
            options = {};
        }
        options.success = (res) => {
            resolve(res as T);
        };
        options.fail = (res) => {
            reject(new Error(`${res && res.errMsg ? res.errMsg : "未知错误"}`));
        };
        api[apiName](options);
    });
};

const getPageId = (vm) => {
    return vm.__wxWebviewId__ ? vm.__wxWebviewId__ : vm.__webviewId__;
};
const getMpComponentInsidePage = (component: any): Promise<any> => {
    return new Promise((resolve) => {
        const platform = getMpPlatform();
        const get = () => {
            if (platform === MpPlatform.alipay) {
                return component.$page;
            }
            if (platform === MpPlatform.smart) {
                return component.pageinstance;
            }
            const pageId = getPageId(component);
            if (pageId) {
                const pages = getCurrentPages();
                if (pages && pages.length) {
                    return pages.find((item) => getPageId(item) === pageId);
                }
            }
        };
        let page = get();
        if (page) {
            resolve(page);
        } else {
            let count = 0;
            const async = () => {
                if (count < 3) {
                    setTimeout(() => {
                        page = get();
                        count++;
                        if (!page) {
                            async();
                        }
                    });
                } else {
                    resolve(page);
                }
            };
            async();
        }
    });
};

const createIntersectionObserver = (vm, options?: any): Promise<any> => {
    const platform = getMpPlatform();
    const isAlipay = platform === MpPlatform.alipay;
    return new Promise((resolve, reject) => {
        if (isAlipay) {
            getMpComponentInsidePage(vm).then((page) => {
                if (!page) {
                    return reject(new Error("无法创建IntersectionObserver"));
                }
                resolve({
                    createIntersectionObserver(...args) {
                        const name = `cio_${uuid()}`;
                        page[name] = function () {
                            return my.createIntersectionObserver.apply(
                                my,
                                args
                            );
                        };
                        const res = page[name]();
                        delete page[name];
                        return res;
                    },
                });
            });
        } else {
            resolve(vm);
        }
    }).then((ctx: any) => {
        return ctx.createIntersectionObserver(options);
    });
};

const createSelectorQuery = (vm): Promise<any> => {
    const platform = getMpPlatform();
    const isAlipay = platform === MpPlatform.alipay;
    return new Promise((resolve, reject) => {
        if (isAlipay) {
            getMpComponentInsidePage(vm).then((page) => {
                if (!page) {
                    return reject(new Error("无法创建小程序SelectorQuery"));
                }
                resolve({
                    createSelectorQuery(...args) {
                        const name = `csq_${uuid()}`;
                        page[name] = function () {
                            return my.createSelectorQuery.apply(my, args);
                        };
                        const res = page[name]();
                        delete page[name];
                        return res;
                    },
                });
            });
        } else {
            resolve(vm);
        }
    }).then((ctx: any) => {
        return ctx.createSelectorQuery();
    });
};

export const MpFc: Fc = {
    onWindowResize(callback: FcStandardCallback<FcWindowSize>) {
        return callMpApi("onWindowResize", callback);
    },
    offWindowResize(callback: FcStandardCallback<FcWindowSize>) {
        return callMpApi("offWindowResize", callback);
    },
    getBoundingClientRect<T = string>(
        /**选择器或者元素本身*/
        selector: T,
        /**小程序平台时，此参数必选*/
        ctx: any
    ): Promise<FcClientRect> {
        return createSelectorQuery(ctx).then((query) => {
            return new Promise((resolve, reject) => {
                // TODO: 支付宝小程序需要放到page onReady生命周期后才能执行
                query
                    .select(selector)
                    .boundingClientRect()
                    .exec((res) => {
                        if (res && res[0] && "height" in res[0]) {
                            resolve(res[0] as FcClientRect);
                        } else {
                            reject(
                                new Error(
                                    `无法获取元素${selector}的boundingClientRect`
                                )
                            );
                        }
                    });
            });
        });
    },
    showToast(title) {
        const options: any = {};
        const platform = getMpPlatform();
        const type = typeof title;
        if (type === "string") {
            options.title = title;
        } else if (title && type === "object") {
            Object.assign(options, title);
        }
        if (platform === MpPlatform.alipay) {
            options.content = options.title;
            options.type = "none";
        } else {
            options.icon = "none";
        }
        return callMpApi("showToast", options);
    },
    showActionSheet(options): Promise<number> {
        if (Array.isArray(options)) {
            options = {
                items: options,
            };
        } else if (typeof options === "object" && options) {
        } else {
            options = {
                items: [],
            };
        }

        const tsOptions: any = options;

        if (!Array.isArray(tsOptions.items)) {
            return Promise.reject(new Error("未传递items选项，无法显示菜单"));
        }
        const platform = getMpPlatform();
        if (platform !== MpPlatform.alipay) {
            tsOptions.itemList = tsOptions.items;
        }
        return promiseifyMpApi("showActionSheet", tsOptions).then(
            (res: any) => {
                if (res && ("tapIndex" in res || "index" in res)) {
                    if (platform === MpPlatform.alipay) {
                        return res.index;
                    }
                    return res.tapIndex as number;
                }
            }
        );
    },
};
