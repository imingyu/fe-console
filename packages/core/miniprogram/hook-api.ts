import {
    FcMethodExecStatus,
    FcMpApiProduct,
    FcMpHookInfo,
    FcMpSocketTask,
    FcMpSocketTaskHookInfo,
    FcMpSocketTaskStatus,
    FcProductType,
    IFcProducer,
} from "@fe-console/types";
import { MixinStore, MkApi } from "@mpkit/mixin";
import { uuid, getMpPlatform } from "@mpkit/util";
import { MpApiVar, MpPlatform } from "@mpkit/types";
import { now } from "@fe-console/util";

const hookSocketMethod = (
    hookState: FcMpHookInfo,
    name: string,
    args,
    taskHookInfo: FcMpSocketTaskHookInfo,
    id?: string
): FcMpApiProduct => {
    id = id || uuid();
    const parentId: string = taskHookInfo[0];
    const product: FcMpApiProduct = {
        id,
        time: now(),
        type: FcProductType.MpApi,
        category: name,
        status: FcMethodExecStatus.Executed,
        request: args,
        parentId,
    };
    if (!args.length || !args[0] || typeof args[0] !== "object") {
        args[0] = {};
    }
    if (typeof args[0] === "object" && args[0]) {
        const { success, fail } = args[0];
        args[0].success = (...s) => {
            product.endTime = now();
            product.status = FcMethodExecStatus.Success;
            product.response = s;
            if (name === "close" || name === "closeSocket") {
                const index = hookState.socketTasks
                    ? hookState.socketTasks.findIndex(
                          (item) => item === taskHookInfo
                      )
                    : -1;
                if (index !== -1) {
                    hookState.socketTasks.splice(index, 1);
                }
            }
            return success && success.apply(null, s);
        };
        args[0].fail = (...s) => {
            product.endTime = now();
            product.status = FcMethodExecStatus.Fail;
            product.response = s;
            return fail && fail.apply(null, s);
        };
    }
    if (taskHookInfo[3]) {
        taskHookInfo[3].children.push(product);
    }
    product.execEndTime = now();
    return product;
};
const socketListenerNames = ["onOpen", "onMessage", "onError", "onClose"];
const hookSocketTask = (
    hookState: FcMpHookInfo,
    socketTask: FcMpSocketTask,
    taskHookInfo: FcMpSocketTaskHookInfo,
    producer: IFcProducer<FcMpApiProduct>
) => {
    const { send, close } = socketTask;
    socketTask.send = function (...args) {
        const product = hookSocketMethod(hookState, "send", args, taskHookInfo);
        producer.create(product);
        const res = send.apply(this, args);
        product.execEndTime = product.endTime = now();
        product.result = res;
        return res;
    };
    socketTask.close = function (...args) {
        const product = hookSocketMethod(
            hookState,
            "close",
            args,
            taskHookInfo
        );
        producer.create(product);
        const res = close.apply(this, args);
        product.execEndTime = now();
        product.result = res;
        return res;
    };
    socketListenerNames.forEach((name) => {
        socketTask[name]((res) => {
            const product: FcMpApiProduct = {
                id: uuid(),
                time: now(),
                type: FcProductType.MpApi,
                category: name,
                parentId: taskHookInfo[0],
                request: res,
                status: FcMethodExecStatus.Executed,
            };
            taskHookInfo[3].children.push(product);
            producer.create(product);
        });
    });
};

const findCurrentHookTask = (
    hookState: FcMpHookInfo,
    producer: IFcProducer<FcMpApiProduct>,
    name,
    args,
    id
) => {
    let activeTask = hookState.socketTasks.find(
        (item) => item[1] !== FcMpSocketTaskStatus.Unknown
    );
    if (
        (!activeTask && !hookState.socketTasks) ||
        !hookState.socketTasks.length
    ) {
        const product: FcMpApiProduct = {
            id,
            type: FcProductType.MpApi,
            category: name,
            request: args,
            status: FcMethodExecStatus.Executed,
            time: now(),
            children: [],
        };
        hookState.socketTasks.push([
            id,
            FcMpSocketTaskStatus.Unknown,
            null,
            product,
        ]);
        activeTask = hookState.socketTasks[hookState.socketTasks.length - 1];
        hookState.productMap[id] = product;
        producer.create(product);
    }
    return activeTask;
};

export const hookMpApi = (
    hookState: FcMpHookInfo,
    producer: IFcProducer<FcMpApiProduct>
): MpApiVar => {
    const PALTFORM = getMpPlatform();
    MixinStore.addHook("Api", {
        before(name, args, handler, id) {
            if (name === "sendSocketMessage" || name === "closeSocket") {
                const activeTask = findCurrentHookTask(
                    hookState,
                    producer,
                    name,
                    args,
                    id
                );
                producer.create(
                    hookSocketMethod(hookState, name, args, activeTask, id)
                );
                return;
            }
            const product: FcMpApiProduct = {
                id,
                type: FcProductType.MpApi,
                category: name,
                request: args,
                status: FcMethodExecStatus.Executed,
                time: now(),
            };
            hookState.productMap[id] = product;
            if (name === "connectSocket") {
                product.children = [];
                if (!hookState.socketTasks) {
                    hookState.socketTasks = [];
                }
                hookState.socketTasks.push([
                    id,
                    FcMpSocketTaskStatus.Connecting,
                    null,
                    product,
                ]);
            }
            producer.create(product);
        },
        after(name, args, result: FcMpSocketTask, id) {
            if (name === "sendSocketMessage" || name === "closeSocket") {
                return;
            }
            if (hookState.productMap[id]) {
                hookState.productMap[id].execEndTime = now();
                hookState.productMap[id].result = result;
            }
            if (name === "connectSocket") {
                const hookTask = hookState.socketTasks
                    ? hookState.socketTasks.find((item) => item[0] === id)
                    : null;
                if (hookTask) {
                    hookTask[2] = result;
                }
                hookSocketTask(hookState, result, hookTask, producer);
            }
        },
        complete(name, args, res, success, id) {
            if (name === "sendSocketMessage" || name === "closeSocket") {
                return;
            }
            if (hookState.productMap[id]) {
                hookState.productMap[id].endTime = now();
                hookState.productMap[id].response = res;
                hookState.productMap[id].status = success
                    ? FcMethodExecStatus.Success
                    : FcMethodExecStatus.Fail;
                delete hookState.productMap[id];
            }
        },
        catch(name, args, error, errType, id) {
            if (hookState.productMap[id]) {
                hookState.productMap[id].endTime = now();
                hookState.productMap[id].response = [error, errType];
                hookState.productMap[id].status = FcMethodExecStatus.Fail;
                setTimeout(() => {
                    delete hookState.productMap[id];
                });
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
