import {
    FcProducerImpl,
    FcMemoryStoragerImpl,
    FcObserverImpl,
    FcNetworkStoragerImpl,
} from "@fe-console/provider";
import {
    FcConsoleProduct,
    FcMpApiProduct,
    FcMpHookInfo,
    FcMpViewProduct,
    FcStoragerRequest,
    IFcProducer,
} from "@fe-console/types";
import {
    DataLevel,
    FailAction,
    LevelSwallowStrategy,
    Squirrel,
    SquirrelOptions,
    SwallowStrategyMode,
} from "squirrel-report";
import { MkApi } from "@mpkit/mixin";
import { hookMpView } from "./hook-view";
import { hookMpApi } from "./hook-api";
import { hookConsole } from "../hook-console";

export const FcMpProducerRunHandler = (producer: FcMpProducer) => {
    const hookState: FcMpHookInfo = {
        productMap: {},
    };
    hookMpApi(hookState, producer as IFcProducer<FcMpApiProduct>);
    hookMpView(hookState, producer as IFcProducer<FcMpViewProduct>);
    hookConsole(producer as IFcProducer<FcConsoleProduct>);
};

export class FcMpProducer extends FcProducerImpl<
    FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
> {
    constructor() {
        super(FcMpProducerRunHandler);
    }
}

/**
 * 将小程序产生的数据存在本地内存中
 */
export class FcMpMemoryStorager extends FcMemoryStoragerImpl<
    FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
> {
    constructor() {
        super();
        this.on("Request", (type, data) => {
            const d: any = data;
            let list: Array<
                FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
            > = [];
            if (typeof d.where === "string") {
                // xxx=id
                // 1:22=type=1&前22条数据
                // 1:20:2=type=1&每页20条数据&第二页
                const arr = d.where.split(":");
                if (arr.length > 1) {
                    const type = parseInt(arr[0]);
                    const pageSize = parseInt(arr[1]) || 10;
                    const pageNum = parseInt(arr[2]);
                    if (isNaN(pageNum)) {
                        for (let i = 0, len = this.list.length; i < len; i++) {
                            if (!type) {
                                list.push(this.list[i]);
                            } else if (this.list[i].type === type) {
                                list.push(this.list[i]);
                            }
                            if (list.length >= pageSize) {
                                break;
                            }
                        }
                    } else {
                        const startIndex = (pageNum - 1) * pageSize;
                        const endIndex = pageNum * pageSize;
                        let index = -1;
                        for (let i = 0, len = this.list.length; i < len; i++) {
                            if (!type) {
                                index = i;
                            } else if (type === this.list[i].type) {
                                index++;
                            }
                            if (index >= startIndex && index <= endIndex) {
                                list.push(this.list[i]);
                                if (list.length >= pageSize) {
                                    break;
                                }
                            }
                            if (index > endIndex) {
                                break;
                            }
                        }
                    }
                } else {
                    const item = this.list.find((item) => item.id === d.where);
                    if (item) {
                        list.push(item);
                    }
                }
            }
            this.emit(
                `Response.${d.id}`,
                (list.length ? list : undefined) as any
            );
        });
    }
}

/**
 * 将小程序产生的数据通过ajax方式上传到远程接口中
 */
export class FcMpAjaxStorager extends FcNetworkStoragerImpl<
    FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
> {
    reporter: Squirrel;
    filter?: Function;
    request: FcStoragerRequest;
    constructor(
        url: string,
        filter?: Function,
        reportOptions: SquirrelOptions = {
            adapter(list) {
                if (!url) {
                    return Promise.reject(new Error("ajax url为空"));
                }
                if (MkApi && typeof (MkApi as any).request === "function") {
                    return (MkApi as any).promiseify({
                        url,
                        data: list,
                    });
                }
                return Promise.reject(
                    new Error("无法在当前浏览器环境中找到小程序request函数")
                );
            },
            failAction: FailAction.recovery,
            strategy: {
                [DataLevel.normal]: [
                    {
                        mode: SwallowStrategyMode.intervalCount,
                        value: 5,
                    },
                    {
                        mode: SwallowStrategyMode.intervalTime,
                        value: 2 * 1000,
                    },
                ],
                [DataLevel.high]: [
                    {
                        mode: SwallowStrategyMode.intervalCount,
                        value: 1,
                    },
                ],
            } as LevelSwallowStrategy,
        }
    ) {
        super();
        this.filter = filter;
        this.reporter = new Squirrel(reportOptions);
        this.request = (list): Promise<void> => {
            if (this.filter && this.filter(list)) {
                this.reporter.stuff(list);
            }
            return Promise.resolve();
        };
    }
}

export abstract class FcMpObserver extends FcObserverImpl<
    string,
    FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
> {}

export class FcMpMemoryObserver extends FcMpObserver {
    constructor(storager: FcMpMemoryStorager) {
        super();
        this.storager = storager;
        this.connected = true;
    }
    connect(): Promise<void> {
        return Promise.resolve();
    }
    close() {
        this.storager.destory();
    }
}
