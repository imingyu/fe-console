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
    FcProducerOptions,
    FcProducerRange,
    FcProductType,
    FcStoragerRequest,
    IFcProducer,
    PartialBy,
} from "@fe-console/types";
import { now } from "@fe-console/util";
import {
    DataLevel,
    FailAction,
    LevelSwallowStrategy,
    Squirrel,
    SquirrelOptions,
    SwallowStrategyMode,
} from "squirrel-report";
import { MkApi } from "@mpkit/mixin";
import { uuid } from "@mpkit/util";
import { hookMpView } from "./hook-view";
import { hookMpApi } from "./hook-api";
import { hookConsole } from "../hook-console";

/**
 * 小程序数据生成者，可通过options配置数据生产范围
 */
export class FcMpProducer extends FcProducerImpl<
    FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
> {
    constructor(public options?: FcProducerOptions) {
        super();
        const hookState: FcMpHookInfo = {};
        const producer = this;
        const hook = [1, 1, 1];
        if (options && !options.immutable) {
            // 只有不可变时，才酌情注入监控代码
            if (typeof options.range === "undefined" || !("range" in options)) {
                // undefiend|不设置=代表监控系统中所有可被监控的范围
            } else if (Array.isArray(options.range)) {
                if (!options.range.length) {
                    // 空数组=所有都不监控
                    hook[0] = hook[1] = hook[2] = 0;
                } else {
                    hook[0] = hook[1] = hook[2] = 0;
                    options.range.forEach((item) => {
                        const range: FcProducerRange =
                            typeof item === "object" && item
                                ? (item as FcProducerRange)
                                : null;
                        if (range) {
                            if (range.type === FcProductType.MpApi) {
                                hook[0] = range.disabled ? 0 : 1;
                            } else if (item === FcProductType.MpView) {
                                hook[1] = range.disabled ? 0 : 1;
                            } else if (item === FcProductType.Console) {
                                hook[2] = range.disabled ? 0 : 1;
                            }
                        } else if (item === FcProductType.MpApi) {
                            hook[0] = 1;
                        } else if (item === FcProductType.MpView) {
                            hook[1] = 1;
                        } else if (item === FcProductType.Console) {
                            hook[2] = 1;
                        }
                    });
                }
            } else if (!options.range) {
                // like false=所有都不监控
                hook[0] = hook[1] = hook[2] = 0;
            }
        }

        const filter = (
            id:
                | string
                | Partial<FcMpApiProduct | FcMpViewProduct | FcConsoleProduct>,
            type?: FcProductType
        ): boolean => {
            return this.filter(id, type);
        };

        hook[0] &&
            hookMpApi(
                hookState,
                producer as IFcProducer<FcMpApiProduct>,
                filter
            );
        hook[2] && hookMpView(producer as IFcProducer<FcMpViewProduct>, filter);
        hook[3] &&
            hookConsole(producer as IFcProducer<FcConsoleProduct>, filter);
    }
    filter(
        id:
            | string
            | Partial<FcMpApiProduct | FcMpViewProduct | FcConsoleProduct>,
        type?: FcProductType
    ): boolean {
        if (!this.options) {
            return true;
        }
        const product: Partial<
            FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
        > =
            typeof id === "object" && id
                ? (id as Partial<
                      FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
                  >)
                : null;
        type = product ? product.type : type;
        if (Array.isArray(this.options.range) && this.options.range.length) {
            let rangeFilter;
            for (let i = this.options.range.length - 1; i >= 0; i--) {
                // 从后向前取，只取一个
                const item = this.options.range[i];
                const range: FcProducerRange =
                    typeof item === "object" && item
                        ? (item as FcProducerRange)
                        : null;
                if (
                    range &&
                    range.type === type &&
                    typeof range.filter === "function"
                ) {
                    rangeFilter = range.filter;
                    break;
                }
            }
            if (rangeFilter && !rangeFilter(id, type)) {
                return false;
            }
        }
        if (typeof this.options.filter === "function") {
            return this.options.filter(id as string, type);
        }
        return true;
    }
    change(
        id: string,
        data?: Partial<FcMpApiProduct | FcMpViewProduct | FcConsoleProduct>
    ) {
        data =
            data ||
            ({} as Partial<
                FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
            >);
        data.id = id;
        if (this.filter(data)) {
            super.change(id, data);
        }
    }
    create(
        data: PartialBy<
            FcMpApiProduct | FcMpViewProduct | FcConsoleProduct,
            "id" | "time"
        >
    ): FcMpApiProduct | FcMpViewProduct | FcConsoleProduct {
        if (!data.id) {
            data.id = uuid();
        }
        if (!data.time) {
            data.time = now();
        }
        if (
            this.filter(
                data as FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
            )
        ) {
            return super.create(data);
        }
        return data as FcMpApiProduct | FcMpViewProduct | FcConsoleProduct;
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
