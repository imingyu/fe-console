import {
    MpcStorageType,
    MpcStorageLike,
    MpcStorageApiData,
    MpcHasTaskApi,
    MpcMethodStatus,
    MpcStorageMethodData,
    MpcStorageEventData,
    MpcStorageConsoleData,
} from "@mp-console/types";
import { MkApi, MkApp, MkPage, MkComponent, MixinStore } from "@mpkit/mixin";
import { MpViewType, MpPlatform } from "@mpkit/types";
import { getMpPlatform, uuid, getMpInitLifeName } from "@mpkit/util";
const socketLifes = ["onOpen", "onMessage", "onError", "onClose"];

const PALTFORM = getMpPlatform();

const hookWebSocketAction = (
    name: string,
    args,
    apiStorageData?: MpcStorageApiData,
    storage?: MpcStorageLike,
    socketTask?: any,
    orgAction?: Function
) => {
    let apiStorageDataList: MpcStorageApiData[] = [];
    if (!apiStorageData && storage) {
        const taskMap = storage.getApiTaskMap(MpcHasTaskApi.connectSocket);
        apiStorageDataList = Object.keys(taskMap).map((item) => taskMap[item]);
    } else if (apiStorageData) {
        apiStorageDataList.push(apiStorageData);
    }
    const storageData: MpcStorageApiData = {
        name,
        type: MpcStorageType.Api,
        status: MpcMethodStatus.Executed,
        id: uuid(),
        time: Date.now(),
        args,
    } as MpcStorageApiData;
    if (!args.length || !args[0]) {
        args[0] = {};
    }
    if (typeof args[0] === "object" && args[0]) {
        const { success, fail } = args[0];
        args[0].success = (...s) => {
            storageData.endTime = Date.now();
            storageData.status = MpcMethodStatus.Success;
            if (s.length < 1) {
                storageData.response = s[0];
            } else {
                storageData.response = s;
            }
            if (storage) {
                if (name === "close" && apiStorageData) {
                    storage.removeApiTask(
                        MpcHasTaskApi.connectSocket,
                        apiStorageData.id
                    );
                } else if (
                    name === "closeSocket" &&
                    apiStorageDataList.length
                ) {
                    apiStorageDataList.forEach((item) => {
                        storage.removeApiTask(
                            MpcHasTaskApi.connectSocket,
                            item.id
                        );
                    });
                }
            }
            return success && success.apply(null, s);
        };
        args[0].fail = (...s) => {
            storageData.endTime = Date.now();
            storageData.status = MpcMethodStatus.Fail;
            if (s.length < 1) {
                storageData.response = s[0];
            } else {
                storageData.response = s;
            }
            return fail && fail.apply(null, s);
        };
    }
    if (apiStorageDataList.length) {
        apiStorageDataList.forEach((item) => {
            if (!item.children) {
                item.children = [];
            }
            item.children.push(storageData);
        });
    }

    if (orgAction) {
        return orgAction.apply(socketTask || null, args);
    }
    return storageData;
};

const wrapWebSocketTask = (
    socketTask: any,
    storage: MpcStorageLike,
    apiStoreData: MpcStorageApiData
) => {
    const { send, close } = socketTask;
    socketTask.send = function (...args) {
        return hookWebSocketAction(
            "send",
            args,
            apiStoreData,
            storage,
            socketTask,
            send
        );
    };
    socketTask.close = function (...args) {
        return hookWebSocketAction(
            "close",
            args,
            apiStoreData,
            storage,
            socketTask,
            close
        );
    };
    socketLifes.forEach((step) => {
        socketTask[step]((res) => {
            apiStoreData.children.push({
                id: uuid(),
                time: Date.now(),
                type: MpcStorageType.Api,
                name: step,
                args: [],
                response: res,
                status: MpcMethodStatus.Executed,
                endTime: Date.now(),
            });
        });
    });
};

export const rewriteApi = (storage: MpcStorageLike) => {
    MixinStore.addHook("Api", {
        before(name, args, handler, id) {
            if (name === "sendSocketMessage" || name === "closeSocket") {
                storage.push(hookWebSocketAction(name, args, null, storage));
                return;
            }
            storage.push({
                id,
                type: MpcStorageType.Api,
                args,
                name,
                status: MpcMethodStatus.Executed,
            } as MpcStorageApiData);
        },
        after(name, args, result, id) {
            if (name === "sendSocketMessage" || name === "closeSocket") {
                return;
            }
            const data = storage.get(id) as MpcStorageApiData;
            if (data) {
                data.result = result;
                if (MpcHasTaskApi[name]) {
                    data.children = [];
                    storage.pushApiTask(data);
                }
                data.endTime = Date.now();
                if (name === MpcHasTaskApi.connectSocket) {
                    wrapWebSocketTask(result, storage, data);
                }
            }
        },
        complete(name, args, res, success, id) {
            if (name === "sendSocketMessage" || name === "closeSocket") {
                return;
            }
            const data = storage.get(id) as MpcStorageApiData;
            if (data) {
                data.response = res;
                data.status = success
                    ? MpcMethodStatus.Success
                    : MpcMethodStatus.Fail;
                data.endTime = Date.now();
            }
        },
        catch(name, args, error, errTyoe, id) {
            const data = storage.get(id) as MpcStorageApiData;
            if (data) {
                data.status = MpcMethodStatus.Fail;
                data.endTime = Date.now();
                data.error = error;
                data.errorType = errTyoe;
            }
        },
    });
    if (PALTFORM === MpPlatform.wechat) {
        wx = MkApi;
    } else if (PALTFORM === MpPlatform.alipay) {
        my = MkApi;
    } else if (PALTFORM === MpPlatform.smart) {
        swan = MkApi;
    } else if (PALTFORM === MpPlatform.tiktok) {
        tt = MkApi;
    }
};

export const rewriteView = (storage: MpcStorageLike) => {
    const isEvent = (obj) =>
        typeof obj === "object" &&
        obj &&
        "type" in obj &&
        obj.type &&
        "currentTarget" in obj &&
        obj.currentTarget;
    const viewHook = {
        before(name, args, handler, id) {
            storage.push({
                id,
                type: MpcStorageType.Method,
                name,
                args,
                view: this,
                status: MpcMethodStatus.Executed,
            } as MpcStorageMethodData);
            if (isEvent(args[0])) {
                const wrapDetail = args[0].detail;
                if (
                    typeof wrapDetail === "object" &&
                    wrapDetail &&
                    wrapDetail._mpcWrap
                ) {
                    const { id, orgDetail } = wrapDetail;
                    const data = storage.get(id) as MpcStorageEventData;
                    if (data) {
                        data.event = args[0];
                        data.handleView = this;
                    }
                    args[0].detail = orgDetail;
                }
            }
        },
        after(name, args, result, id) {
            const data = storage.get(id) as MpcStorageMethodData;
            if (data) {
                data.result = result;
                data.endTime = Date.now();
            }
        },
        catch(name, args, error, errTyoe, id) {
            const data = storage.get(id) as MpcStorageMethodData;
            if (data) {
                data.status = MpcMethodStatus.Fail;
                data.endTime = Date.now();
                data.error = error;
                data.errorType = errTyoe;
            }
        },
    };
    MixinStore.addHook(MpViewType.App, viewHook);
    MixinStore.addHook(MpViewType.Page, viewHook);
    MixinStore.addHook(MpViewType.Component, viewHook);
    function rewriteTrigger() {
        if ("triggerEvent" in this) {
            this.$nativeTriggerEvent = this.triggerEvent;
            this.triggerEvent = function (...args) {
                const orgDetail = args[1];
                const orgArgs = [args[0], args[1], args[2]];
                const id = uuid();
                const name = args[0];
                args[1] = {
                    id,
                    _mpcWrap: true,
                    orgDetail,
                };
                const data = {} as MpcStorageEventData;
                data.id = id;
                data.type = MpcStorageType.Event;
                data.name = name;
                data.args = orgArgs;
                data.triggerView = this;
                storage.push(data);
                return this.$nativeTriggerEvent.apply(this.args);
            };
        }
    }
    MixinStore.addHook(MpViewType.Page, {
        [getMpInitLifeName(MpViewType.Page)]: {
            before: rewriteTrigger,
        },
    });
    MixinStore.addHook(MpViewType.Component, {
        [getMpInitLifeName(MpViewType.Component)]: {
            before: rewriteTrigger,
        },
    });
    const wrapView = (native, mkView) => {
        return (spec) => {
            native(mkView(spec));
        };
    };
    App = wrapView(App, MkApp);
    Page = wrapView(App, MkPage);
    Component = wrapView(App, MkComponent);
};

export const rewriteConsole = (storage: MpcStorageLike) => {
    if (typeof console === "object" && console) {
        Object.keys(console).forEach((key) => {
            const method = console[key];
            if (typeof method === "function") {
                console[key] = function (...args) {
                    storage.push({
                        type: MpcStorageType.Console,
                        args,
                    } as MpcStorageConsoleData);
                };
            }
        });
    }
};
