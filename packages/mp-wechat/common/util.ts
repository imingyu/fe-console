import { uuid } from "@mpkit/util";
import { MkApi } from "@mpkit/mixin";
export const removeEndZero = (num: number | string): string => {
    const str = num + "";
    if (str.indexOf(".") === -1) {
        return str;
    }
    let [before, after] = str.split(".");
    const af = parseInt(after);
    return before + (af === 0 ? "" : `.${af}`);
};
const getPageId = (vm) => {
    return vm.__wxWebviewId__ ? vm.__wxWebviewId__ : vm.__webviewId__;
};
export const getMpComponentInsidePage = (component: any): Promise<any> => {
    return new Promise((resolve) => {
        const get = () => {
            // 
            // 
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

export const createIntersectionObserver = (vm, options?: any) => {
    const isAlipay = "";
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

export const createSelectorQuery = (vm) => {
    const isAlipay = "";
    return new Promise((resolve, reject) => {
        if (isAlipay) {
            getMpComponentInsidePage(vm).then((page) => {
                if (!page) {
                    return reject(new Error("无法创建SelectorQuery"));
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

export const computeTime = (total: number): string => {
    let timeUnit;
    let timeVal;
    if (total < 1000) {
        timeUnit = "ms";
        timeVal = removeEndZero(total.toFixed(2));
    } else if (total < 60 * 1000) {
        timeUnit = "s";
        timeVal = removeEndZero((total / 1000).toFixed(2));
    } else if (total < 60 * 60 * 1000) {
        timeUnit = "m";
        timeVal = removeEndZero((total / (60 * 1000)).toFixed(2));
    } else {
        timeUnit = "h";
        timeVal = removeEndZero((total / (60 * 60 * 1000)).toFixed(2));
    }
    return `${timeVal}${timeUnit}`;
};

export const isFullScreenPhone = (): Promise<boolean> => {
    return new Promise((resolve) => {
        if ((MkApi as any).getSystemInfo) {
            (MkApi as any).getSystemInfo({
                success(res) {
                    resolve(
                        res &&
                            "statusBarHeight" in res &&
                            res.statusBarHeight > 20
                            ? true
                            : false
                    );
                },
                fail() {
                    resolve(false);
                },
            });
        } else {
            resolve(false);
        }
    });
};

export const findValue = (obj: any, prop: string): any => {
    for (let key in obj) {
        if (key === prop || key.toLowerCase() === prop.toLowerCase()) {
            return obj[prop];
        }
    }
};
