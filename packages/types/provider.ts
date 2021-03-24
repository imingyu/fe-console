import { PartialBy } from "./tool";
import { FcStackInfo, IFcEventEmitter } from "./util";
export interface FcProductOptionalProps {
    time?: number;
    id?: string;
    name?: string;
}

export interface FcProduct {
    id: string;
    time: number;
    /** 如果存在父子关系，子数据需要携带父数据的id */
    parentId?: string;
    stack?: FcStackInfo[];
    // [prop: string]: any;
}
export interface FcWhereProduct<T> extends FcProduct {
    where: T;
}

/**
 * 数据原料筛选函数，调用时机：1.原料对象创建前（传递原料ID和类型、context）；2.原料准备送往生成事件（create）前（已创建好的原料对象包含很多信息）；3.原料变化对象创建前（传递原料ID和类型、context）；4.原料准备送往变化(change)事件前（传递原料的变化对象，一定包含ID，其他字段可能包含）；
 */
export interface FcProductFilter<T extends FcProduct = FcProduct, S = number> {
    (data: Partial<T>, context?: any): boolean;
    (id: string, type?: S, context?: any): boolean;
}
export interface IFcProducer<T extends FcProduct = FcProduct>
    extends IFcEventEmitter<T> {
    create(data: PartialBy<T, "id" | "time">): T;
    change(id: string, data?: Partial<T>);
}
export interface FcStoragerFilter<T extends FcProduct = FcProduct> {
    (): T[] | Promise<T[]>;
}

export interface FcStoragerRequest<T extends FcProduct = FcProduct> {
    (list: T): Promise<any>;
}
export interface IFcStorager<T extends FcProduct = FcProduct>
    extends IFcEventEmitter<T> {
    getList(filter: FcStoragerFilter): Promise<T[]>;
    push(data: T);
    change(id: string, data?: Partial<T>);
    destory();
}

export interface IFcObserver<
    W = string,
    T extends FcProduct = FcProduct,
    S extends FcProduct = FcProduct
> extends IFcEventEmitter<T> {
    storager?: IFcStorager<S>;
    connect(storager?: IFcStorager<S>): Promise<void>;
    close();
    call<R = Array<T>>(where: W, eid?: string, timeout?: number): Promise<R>;
}
