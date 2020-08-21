import {
    FecStorageType,
    FecStorageLike,
    FecStorageApiData,
    MpHasTaskApi,
    FecMethodStatus,
    FecStorageMethodData,
    FecStorageEventData,
    FecStorageConsoleData,
    FecStorageViewData,
} from "@fe-console/types";
import { MkApi, MkApp, MkPage, MkComponent, MixinStore } from "@mpkit/mixin";
import { MpViewType, MpPlatform } from "@mpkit/types";
import { getMpPlatform, uuid, getMpInitLifeName } from "@mpkit/util";
const socketLifes = ["onOpen", "onMessage", "onError", "onClose"];

const PALTFORM = getMpPlatform();

const hookWebSocketAction = (
    name: string,
    args,
    apiStorageData?: FecStorageApiData,
    storage?: FecStorageLike,
    socketTask?: any,
    orgAction?: Function
) => {
    let apiStorageDataList: FecStorageApiData[] = [];
    if (!apiStorageData && storage) {
        const taskMap = storage.getApiTaskMap(MpHasTaskApi.connectSocket);
        apiStorageDataList = Object.keys(taskMap).map((item) => taskMap[item]);
    } else if (apiStorageData) {
        apiStorageDataList.push(apiStorageData);
    }
    const storageData: FecStorageApiData = {
        name,
        type: FecStorageType.Api,
        status: FecMethodStatus.Executed,
        id: uuid(),
        time: Date.now(),
        args,
    } as FecStorageApiData;
    if (!args.length || !args[0]) {
        args[0] = {};
    }
    if (typeof args[0] === "object" && args[0]) {
        const { success, fail } = args[0];
        args[0].success = (...s) => {
            storageData.endTime = Date.now();
            storageData.status = FecMethodStatus.Success;
            if (s.length < 1) {
                storageData.response = s[0];
            } else {
                storageData.response = s;
            }
            if (storage) {
                if (name === "close" && apiStorageData) {
                    storage.removeApiTask(
                        MpHasTaskApi.connectSocket,
                        apiStorageData.id
                    );
                } else if (
                    name === "closeSocket" &&
                    apiStorageDataList.length
                ) {
                    apiStorageDataList.forEach((item) => {
                        storage.removeApiTask(
                            MpHasTaskApi.connectSocket,
                            item.id
                        );
                    });
                }
            }
            return success && success.apply(null, s);
        };
        args[0].fail = (...s) => {
            storageData.endTime = Date.now();
            storageData.status = FecMethodStatus.Fail;
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
    storage: FecStorageLike,
    apiStoreData: FecStorageApiData
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
                type: FecStorageType.Api,
                name: step,
                args: [],
                response: res,
                status: FecMethodStatus.Executed,
                endTime: Date.now(),
            });
        });
    });
};

export const rewriteMpApi = (storage: FecStorageLike): any => {
    MixinStore.addHook("Api", {
        before(name, args, handler, id) {
            if (name === "sendSocketMessage" || name === "closeSocket") {
                storage.push(hookWebSocketAction(name, args, null, storage));
                return;
            }
            storage.push({
                id,
                type: FecStorageType.Api,
                args,
                name,
                status: FecMethodStatus.Executed,
            } as FecStorageApiData);
        },
        after(name, args, result, id) {
            if (name === "sendSocketMessage" || name === "closeSocket") {
                return;
            }
            const data = storage.get(id) as FecStorageApiData;
            if (data) {
                data.result = result;
                if (MpHasTaskApi[name]) {
                    data.children = [];
                    storage.pushApiTask(data);
                }
                data.endTime = Date.now();
                if (name === MpHasTaskApi.connectSocket) {
                    wrapWebSocketTask(result, storage, data);
                }
            }
        },
        complete(name, args, res, success, id) {
            if (name === "sendSocketMessage" || name === "closeSocket") {
                return;
            }
            const data = storage.get(id) as FecStorageApiData;
            if (data) {
                data.response = res;
                data.status = success
                    ? FecMethodStatus.Success
                    : FecMethodStatus.Fail;
                data.endTime = Date.now();
            }
        },
        catch(name, args, error, errTyoe, id) {
            const data = storage.get(id) as FecStorageApiData;
            if (data) {
                data.status = FecMethodStatus.Fail;
                data.endTime = Date.now();
                data.error = error;
                data.errorType = errTyoe;
            }
        },
    });
    if (PALTFORM === MpPlatform.wechat) {
        wx = MkApi;
        return wx;
    } else if (PALTFORM === MpPlatform.alipay) {
        my = MkApi;
        return my;
    } else if (PALTFORM === MpPlatform.smart) {
        swan = MkApi;
        return swan;
    } else if (PALTFORM === MpPlatform.tiktok) {
        tt = MkApi;
        return tt;
    }
};

export const rewriteMpView = (storage: FecStorageLike) => {
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
                type: FecStorageType.Method,
                name,
                args,
                view: this,
                status: FecMethodStatus.Executed,
            } as FecStorageMethodData);
            if (isEvent(args[0])) {
                const wrapDetail = args[0].detail;
                if (
                    typeof wrapDetail === "object" &&
                    wrapDetail &&
                    wrapDetail._mpcWrap
                ) {
                    const { id, orgDetail } = wrapDetail;
                    const data = storage.get(id) as FecStorageEventData;
                    if (data) {
                        data.event = args[0];
                        data.handleView = this;
                    }
                    args[0].detail = orgDetail;
                }
            }
        },
        after(name, args, result, id) {
            const data = storage.get(id) as FecStorageMethodData;
            if (data) {
                data.result = result;
                data.endTime = Date.now();
            }
        },
        catch(name, args, error, errTyoe, id) {
            const data = storage.get(id) as FecStorageMethodData;
            if (data) {
                data.status = FecMethodStatus.Fail;
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
                const data = {} as FecStorageEventData;
                data.id = id;
                data.type = FecStorageType.Event;
                data.name = name;
                data.args = orgArgs;
                data.triggerView = this;
                storage.push(data);
                return this.$nativeTriggerEvent.apply(this.args);
            };
        }
    }
    MixinStore.addHook(MpViewType.App, {
        [getMpInitLifeName(MpViewType.App)]: {
            before() {
                storage.push({
                    type: FecStorageType.View,
                    view: this,
                } as FecStorageViewData);
            },
        },
    });
    MixinStore.addHook(MpViewType.Page, {
        [getMpInitLifeName(MpViewType.Page)]: {
            before() {
                storage.push({
                    type: FecStorageType.View,
                    view: this,
                } as FecStorageViewData);
                rewriteTrigger.call(this);
            },
        },
    });
    MixinStore.addHook(MpViewType.Component, {
        [getMpInitLifeName(MpViewType.Component)]: {
            before() {
                storage.push({
                    type: FecStorageType.View,
                    view: this,
                } as FecStorageViewData);
                rewriteTrigger.call(this);
            },
        },
    });
    const wrapView = (native, mkView) => {
        return (spec) => {
            return native(mkView(spec));
        };
    };
    App = wrapView(App, MkApp);
    Page = wrapView(App, MkPage);
    Component = wrapView(App, MkComponent);
};

export const rewriteMpConsole = (storage: FecStorageLike) => {
    if (typeof console === "object" && console) {
        Object.keys(console).forEach((key) => {
            const method = console[key];
            if (typeof method === "function") {
                console[key] = function (...args) {
                    storage.push({
                        type: FecStorageType.Console,
                        args,
                    } as FecStorageConsoleData);
                };
            }
        });
    }
};
