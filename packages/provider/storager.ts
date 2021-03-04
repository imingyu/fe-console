import {
    FcProduct,
    FcStoragerFilter,
    FcStoragerRequest,
    IFcStorager,
} from "@fe-console/types";
import { FcEventEmitter } from "@fe-console/util";
/**
 * 存储者，负责保存数据，至于怎么保存，存在哪，存多久，看具体实现
 */
export abstract class FcStoragerImpl<T extends FcProduct = FcProduct>
    extends FcEventEmitter<T>
    implements IFcStorager<T> {
    getList(filter: FcStoragerFilter<T>): Promise<T[]> {
        const list = filter();
        if (list && "then" in list) {
            return list;
        } else {
            return Promise.resolve(list);
        }
    }
    push(data: T) {
        this.emit("data", data);
    }
    destory() {
        this.emit("destory");
    }
}

/**
 * 存储数据在内存中
 */
export class FcMemoryStoragerImpl<
    T extends FcProduct = FcProduct
> extends FcStoragerImpl<T> {
    protected list: T[] = [];
    constructor() {
        super();
    }
    push(data: T) {
        this.list.push(data);
        super.push(data);
    }
    destory() {
        this.list.splice(0, this.list.length);
        super.destory();
    }
}

/**
 * 存储数据到网络中
 */
export abstract class FcNetworkStoragerImpl<
    T extends FcProduct = FcProduct
> extends FcStoragerImpl<T> {
    abstract request: FcStoragerRequest;
    push(data: T): Promise<any> {
        super.push(data);
        return this.request(data);
    }
}
