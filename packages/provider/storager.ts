import {
    FcProduct,
    FcStoragerRequestHandler,
    IFcStorager,
} from "@fe-console/types";
import {
    Squirrel,
    SquirrelOptions,
    SwallowStrategyMode,
    DataLevel,
    SwallowStrategyDetail,
    FailAction,
    LevelSwallowStrategy,
} from "squirrel-report";
import { FcEventEmitter } from "@fe-console/util";
/**
 * 存储者，负责保存数据，至于怎么保存，存在哪，存多久，看具体实现
 */
export abstract class FcStoragerImpl<T extends FcProduct = FcProduct>
    extends FcEventEmitter<T>
    implements IFcStorager<T> {
    constructor() {
        super();
    }
    push(data: T) {
        this.emit("data", data);
    }
}

/**
 * 存储数据在内存中
 */
export abstract class FcMemoryStoragerImpl<T extends FcProduct = FcProduct>
    extends FcEventEmitter<T>
    implements IFcStorager<T> {
    protected list: T[] = [];
    constructor() {
        super();
    }
    push(data: T) {
        this.list.push(data);
        this.emit("data", data);
    }
    destory() {
        super.destory();
        this.list.splice(0, this.list.length);
    }
}

/**
 * 存储数据到网络中
 */
export abstract class FcNetworkStoragerImpl<
    T extends FcProduct = FcProduct
> extends FcStoragerImpl<T> {
    protected reporter: Squirrel;
    constructor(
        public request: FcStoragerRequestHandler<T>,
        reportOptions?: SquirrelOptions
    ) {
        super();
        if (!reportOptions) {
            // 数据还是存在内存中，如果插入的数据优先级较高时才上传
            reportOptions = {
                adapter: this.request,
                failAction: FailAction.recovery,
                strategy: {
                    [DataLevel.high]: {
                        mode: SwallowStrategyMode.intervalCount,
                        value: 1,
                    } as SwallowStrategyDetail,
                } as LevelSwallowStrategy,
            };
        }
        this.reporter = new Squirrel(reportOptions);
    }
    push(data: T, level: DataLevel = DataLevel.normal) {
        super.push(data);
        this.reporter.stuff(data, level);
    }
    destory() {
        super.destory();
        this.reporter && this.reporter.destory();
    }
}
