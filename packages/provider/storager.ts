import { isEmptyObject } from "@mpkit/util";
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
    change(id: string, data?: Partial<T>) {
        data = data || ({} as Partial<T>);
        data.id = id;
        this.emit("change", data as T);
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
    protected indexIdMap: { [prop: string]: number } = {};
    constructor() {
        super();
    }
    push(data: T) {
        this.indexIdMap[data.id] = this.list.length;
        this.list.push(data);
        super.push(data);
    }
    change(id: string, data?: Partial<T>) {
        let item =
            id in this.indexIdMap ? this.list[this.indexIdMap[id]] : null;
        if (!item) {
            const index = this.list.findIndex((it) => it.id === id);
            if (index !== -1) {
                this.indexIdMap[id] = index;
                item = this.list[index];
            }
        }
        if (item && !isEmptyObject(data)) {
            Object.assign(item, data);
        }
        super.change(id, data);
    }
    destory() {
        this.list.splice(0, this.list.length);
        this.indexIdMap = {};
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
    change(id: string, data?: Partial<T>) {
        super.change(id, data);
        data = data || ({} as Partial<T>);
        data.id = id;
        return this.request(data as T);
    }
}
