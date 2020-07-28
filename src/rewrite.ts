import { uuid, rewrite, getViewLabel, each, isPlainObject } from "./util";
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
const consoleMethods = ["log", "dir", "error", "warn", "info"];
export const rewriteConsole = (
    nativeTarget: Console,
    storage: Storage
): Console => {
    return rewrite(nativeTarget, (value, prop) => {
        if (consoleMethods.indexOf(prop as string) !== -1) {
            return function (...args) {
                storage.push(StorageType.CONSOLE, {
                    name: prop,
                    args,
                });
                return value.apply(this, args);
            };
        }
        return value;
    }) as Console;
};
const viewLife = {
    App: ["onLaunch", "onShow", "onHide", "onError"],
    Page: ["onLoad", "onReady", "onShow", "onHide", "onUnload"],
    Component: ["created", "attached", "ready", "moved", "detached"],
};
const initViewMPC = (vm, storage, viewName, facData) => {
    if (!vm.$mpcId) {
        vm.$mpcId = uuid();
    }
    if (!vm.$mpcStorage) {
        vm.$mpcStorage = storage;
    }
    const label = getViewLabel(vm, viewName);
    if (!facData.label) {
        facData.label = label;
    }
    if (!vm.$mpcInitState) {
        vm.$mpcInitState = true;
        const initState = {};
        each(vm, (value, prop) => {
            if (prop === "data") {
                initState[prop] = JSON.parse(JSON.stringify(value));
            } else {
                const valType = typeof value;
                if (valType !== "function") {
                    if (isPlainObject(value)) {
                        initState[prop] = JSON.parse(JSON.stringify(value));
                    } else {
                        initState[prop] = value;
                    }
                }
            }
        });
        vm.$mpcStorage.push(
            StorageType.VIEW,
            {
                label,
                method: '#initState',
                view: vm,
                response: initState,
            },
            vm.$mpcId
        );
    }
};
const rewriteNativeMethod = (vm) => {
    if (!vm.$isRewriteSetData) {
        vm.$nativeSetData = vm.setData;
        vm.setData = function (data: any, callback: Function) {};
    }
};
const rewritePropObserver = (
    propSpec,
    propName,
    storage,
    viewName,
    facData
) => {
    const specType = typeof propSpec;
    if (specType === "function") {
        return {
            type: propSpec,
            observer(...args) {
                initViewMPC(this, storage, viewName, facData);
                rewriteNativeMethod(this);
            },
        };
    } else if (specType === "object") {
        const orgObserver = propSpec.observer;
        propSpec.observer = function (...args) {
            initViewMPC(this, storage, viewName, facData);
            rewriteNativeMethod(this);
            return orgObserver.apply(this, args);
        };
        return propSpec;
    }
};
const exexFunc = function (viewName, methodValue, methodName, ...args) {
    const res = (methodValue as Function).apply(this, args);
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
            method: methodName,
            view: this,
            response: methodResult,
        },
        this.$mpcId
    );
    if (
        args[0] &&
        typeof args[0] === "object" &&
        typeof args[0].currentTarget === "object" &&
        args[0].type
    ) {
        this.$mpcStorage.push(
            StorageType.EVENT,
            {
                label,
                args,
                method: methodName,
                view: this,
                response: methodResult,
                event: args[0],
            },
            this.$mpcId
        );
    }
    return res;
};
const mergeMethod = (viewName, target, plus?) => {
    each(target, (methodValue, methodName) => {
        if (typeof methodValue === "function") {
            target[methodName] = function (...args) {
                if (viewName !== "App") {
                    rewriteNativeMethod(this);
                }
                plus && plus[methodName] && plus[methodName].apply(this, args);
                return exexFunc.apply(this, [
                    viewName,
                    methodValue,
                    methodName,
                    ...args,
                ]);
            };
        }
    });
};
export const rewriteView = (
    nativeView: Function,
    viewName: string,
    storage: Storage
): Function => {
    function ViewFactory(spec: any) {
        const facData = {
            name: viewName,
            label: getViewLabel(null, viewName),
            args: [spec],
        };
        storage.push(StorageType.VIEW, facData);
        let plus = {};
        each(viewLife[viewName], (lifeName) => {
            plus[lifeName as string] = function (...args) {
                initViewMPC(this, storage, viewName, facData);
            };
        });
        mergeMethod(spec, plus);
        if (viewName === "Component") {
            if (spec.methods) {
                mergeMethod(viewName, spec.methods);
            }
            if (spec.lifetimes) {
                mergeMethod(viewName, spec.lifetimes, plus);
            }
            if (spec.pageLifetimes) {
                mergeMethod(viewName, spec.pageLifetimes);
            }
            each(plus, (methodValue, methodName) => {
                if (
                    !spec[methodName] &&
                    ((spec.lifetimes && !spec.lifetimes[methodName]) ||
                        !spec.lifetimes)
                ) {
                    spec[methodName] = function (...args) {
                        rewriteNativeMethod(this);
                        return exexFunc.apply(this, [
                            viewName,
                            methodValue,
                            methodName,
                            ...args,
                        ]);
                    };
                }
            });
            if (spec.properties) {
                each(spec.properties, (propSpec, propName) => {
                    spec.properties[propName] = rewritePropObserver(
                        propSpec,
                        propName,
                        storage,
                        viewName,
                        facData
                    );
                });
            }
        }
        return nativeView(spec);
    }
    ViewFactory.displayName = viewName;
    return ViewFactory;
};
