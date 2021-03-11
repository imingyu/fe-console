import {
    FcMethodExecStatus,
    FcMpApiProduct,
    FcMpHookInfo,
    FcMpSocketTask,
    FcMpSocketTaskHookInfo,
    FcMpSocketTaskStatus,
    FcProductFilter,
    FcProductType,
    IFcProducer,
} from "@fe-console/types";
import { MixinStore, MkApi } from "@mpkit/mixin";
import { uuid, getMpPlatform } from "@mpkit/util";
import { MpApiVar, MpPlatform } from "@mpkit/types";
import { $$getStack, now } from "@fe-console/util";

const hookSocketMethod = (
    producer: IFcProducer<FcMpApiProduct>,
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
        stack: $$getStack(),
    };
    if (!args.length || !args[0] || typeof args[0] !== "object") {
        args[0] = {};
    }
    if (typeof args[0] === "object" && args[0]) {
        const { success, fail } = args[0];
        args[0].success = (...s) => {
            producer.change(id, {
                endTime: now(),
                status: FcMethodExecStatus.Success,
                response: s,
            });
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
            producer.change(id, {
                endTime: now(),
                status: FcMethodExecStatus.Fail,
                response: s,
            });
            return fail && fail.apply(null, s);
        };
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
        const product = hookSocketMethod(
            producer,
            hookState,
            "send",
            args,
            taskHookInfo
        );
        producer.create(product);
        const res = send.apply(this, args);
        producer.change(product.id, {
            endTime: now(),
            execEndTime: now(),
            result: res,
        });
        return res;
    };
    socketTask.close = function (...args) {
        const product = hookSocketMethod(
            producer,
            hookState,
            "close",
            args,
            taskHookInfo
        );
        producer.create(product);
        const res = close.apply(this, args);
        producer.change(product.id, {
            endTime: now(),
            execEndTime: now(),
            result: res,
        });
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
                stack: $$getStack(),
            };
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
    let activeTask = hookState.socketTasks
        ? hookState.socketTasks.find(
              (item) => item[1] !== FcMpSocketTaskStatus.Unknown
          )
        : null;
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
            stack: $$getStack(),
        };
        if (!hookState.socketTasks) {
            hookState.socketTasks = [];
        }
        hookState.socketTasks.push([id, FcMpSocketTaskStatus.Unknown, null]);
        activeTask = hookState.socketTasks[hookState.socketTasks.length - 1];
        producer.create(product);
    }
    return activeTask;
};

export const hookMpApi = (
    hookState: FcMpHookInfo,
    producer: IFcProducer<FcMpApiProduct>,
    filter?: FcProductFilter<FcMpApiProduct>
): MpApiVar => {
    const PALTFORM = getMpPlatform();
    MixinStore.addHook("Api", {
        before(name, args, handler, id) {
            if (filter && !filter(id, FcProductType.MpApi)) {
                return;
            }
            if (name === "sendSocketMessage" || name === "closeSocket") {
                const activeTask = findCurrentHookTask(
                    hookState,
                    producer,
                    name,
                    args,
                    id
                );
                producer.create(
                    hookSocketMethod(
                        producer,
                        hookState,
                        name,
                        args,
                        activeTask,
                        id
                    )
                );
                return;
            }
            if (name === "connectSocket") {
                if (!hookState.socketTasks) {
                    hookState.socketTasks = [];
                }
                hookState.socketTasks.push([
                    id,
                    FcMpSocketTaskStatus.Connecting,
                    null,
                ]);
            }
            const product: FcMpApiProduct = {
                id,
                type: FcProductType.MpApi,
                category: name,
                request: args,
                status: FcMethodExecStatus.Executed,
                time: now(),
                stack: $$getStack(),
            };
            producer.create(product);
        },
        after(name, args, result: FcMpSocketTask, id) {
            if (filter && !filter(id, FcProductType.MpApi)) {
                return;
            }
            if (name === "sendSocketMessage" || name === "closeSocket") {
                return;
            }
            producer.change(id, {
                execEndTime: now(),
                result,
            });
            if (name === "connectSocket") {
                const hookTask = hookState.socketTasks
                    ? hookState.socketTasks.find((item) => item[0] === id)
                    : null;
                if (hookTask) {
                    hookTask[2] = result;
                }
                if (result) {
                    hookSocketTask(hookState, result, hookTask, producer);
                }
            }
        },
        complete(name, args, res, success, id) {
            if (filter && !filter(id, FcProductType.MpApi)) {
                return;
            }
            if (name === "sendSocketMessage" || name === "closeSocket") {
                return;
            }
            producer.change(id, {
                endTime: now(),
                response: [res],
                status: success
                    ? FcMethodExecStatus.Success
                    : FcMethodExecStatus.Fail,
            });
        },
        catch(name, args, error, errType, id) {
            if (filter && !filter(id, FcProductType.MpApi)) {
                return;
            }
            producer.change(id, {
                endTime: now(),
                response: [error, errType],
                status: FcMethodExecStatus.Fail,
            });
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
