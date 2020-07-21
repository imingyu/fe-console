import { uuid, rewrite, getViewLabel, each } from "./util";
import { Storage, StorageType } from "./storage";
export interface ApiHandler {
    (res: any);
}
export interface ApiOptions {
    success: ApiHandler;
    fail: ApiHandler;
}
const networkApis = ["request", "downloadFile", "uploadFile"];
const socketLifes = ["onOpen", "onClose", "onError"];
export const rewriteMP = (nativeMp: object, storage: Storage) => {
    return rewrite(nativeMp, (value, prop) => {
        const methodHandler = value as Function;
        const methodName = prop as string;
        return function (...args) {
            const funId = uuid();
            const res = methodHandler.apply(this, args);
            const asyncResult = {
                type: "wait",
                time: null,
                data: null,
            };
            if (methodName.indexOf("Sync") === -1 && !args.length) {
                args[0] = {};
            }
            if (typeof args[0] === "object" && args[0]) {
                const { success, fail } = args[0];
                args[0].success = (...params) => {
                    asyncResult.type = "success";
                    if (params.length < 1) {
                        asyncResult.data = params[0];
                    }
                    asyncResult.time = Date.now();
                    return success && success.apply(null, params);
                };
                args[0].fail = (...params) => {
                    asyncResult.type = "fail";
                    if (params.length < 1) {
                        asyncResult.data = params[0];
                    }
                    asyncResult.time = Date.now();
                    return fail && fail.apply(null, params);
                };
            }
            if (methodName === "connectSocket") {
                const orgSend = res.send;
                res.send = function (...params) {
                    const sendResult = {
                        type: "wait",
                        time: null,
                        data: null,
                    };
                    if (!params.length) {
                        params[0] = {};
                    }
                    if (typeof params[0] === "object" && params[0]) {
                        const { success, fail } = params[0];
                        params[0].success = (...s) => {
                            sendResult.type = "success";
                            if (s.length < 1) {
                                sendResult.data = s[0];
                            } else {
                                sendResult.data = s;
                            }
                            sendResult.time = Date.now();
                            return success && success.apply(null, s);
                        };
                        params[0].fail = (...s) => {
                            sendResult.type = "fail";
                            if (s.length < 1) {
                                sendResult.data = s[0];
                            } else {
                                sendResult.data = s;
                            }
                            sendResult.time = Date.now();
                            return fail && fail.apply(null, s);
                        };
                    }
                    storage.push(
                        StorageType.NETWORK,
                        {
                            name: methodName,
                            args: params,
                            category: "send",
                            response: sendResult,
                        },
                        funId
                    );
                    return orgSend.apply(this, params);
                };
                each(socketLifes, (life) => {
                    res[life]((res) => {
                        storage.push(
                            StorageType.NETWORK,
                            {
                                name: methodName,
                                category: life,
                                response: res,
                            },
                            funId
                        );
                    });
                });
                res.onMessage((res) => {
                    storage.push(
                        StorageType.NETWORK,
                        {
                            name: methodName,
                            category: "onMessage",
                            response: res,
                        },
                        funId
                    );
                });
            }
            const storageData = {
                name: methodName,
                args,
                result: res,
                response: asyncResult,
            };
            storage.push(StorageType.API, storageData, funId);
            if (networkApis.indexOf(methodName) !== -1) {
                storage.push(StorageType.NETWORK, storageData, funId);
            }
            return res;
        };
    });
};
export const rewriteConsole = (
    nativeTarget: Console,
    storage: Storage
): Console => {
    return rewrite(nativeTarget, (value, prop) => {
        return function (...args) {
            storage.push(StorageType.CONSOLE, {
                name: prop,
                args,
            });
            return value.apply(this, args);
        };
    }) as Console;
};
const viewLife = {
    App: ["onLaunch", "onShow", "onHide", "onError"],
    Page: ["onLoad", "onReady", "onShow", "onHide", "onUnload"],
    Component: ["created", "attached", "ready", "moved", "detached"],
};
export const rewriteView = (
    nativeView: Function,
    viewName: string,
    storage: Storage
): Function => {
    return function View(spec: any) {
        const facData = {
            name: viewName,
            label: getViewLabel(null, viewName),
            args: [spec],
        };
        storage.push(StorageType.VIEW, facData);
        let plus = {};
        each(viewLife[viewName], (name) => {
            plus[name as string] = function (...args) {
                if (!this.$mpcId) {
                    this.$mpcId = uuid();
                }
                if (!this.$mpcStorage) {
                    this.$mpcStorage = storage;
                }
                const label = getViewLabel(this, viewName);
                if (!facData.label) {
                    facData.label = label;
                }
            };
        });
        const mergeMethod = (target, plus) => {
            each(target, (method, name) => {
                if (typeof method === "function") {
                    target[name] = function (...args) {
                        plus[name] && plus[name].apply(this, args);
                        const res = (method as Function).apply(this, args);
                        const label = getViewLabel(this, viewName);
                        const methodResult = {
                            type: "wait",
                            data: null,
                            time: null,
                        };
                        if (typeof res === "object" && res.then) {
                            res.then((data) => {
                                methodResult.type = "success";
                                methodResult.time = Date.now();
                                methodResult.data = data;
                            });
                            res.catch((data) => {
                                methodResult.type = "fail";
                                methodResult.time = Date.now();
                                methodResult.data = data;
                            });
                        } else {
                            methodResult.type = "done";
                            methodResult.time = Date.now();
                            methodResult.data = res;
                        }
                        this.$mpcStorage.push(
                            StorageType.VIEW,
                            {
                                label,
                                args,
                                method: name,
                                view: this,
                                response: methodResult,
                            },
                            this.$mpcId
                        );
                        return res;
                    };
                }
            });
            each(plus, (method, name) => {
                if (!target[name]) {
                    target[name] = function (...args) {
                        return (method as Function).apply(this, args);
                    };
                }
            });
        };
        mergeMethod(spec, plus);
        if (spec.methods) {
            mergeMethod(spec.methods, plus);
        }
        return nativeView(spec);
    };
};
