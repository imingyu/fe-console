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

export interface FcProducerRunHandler<T extends FcProduct = FcProduct> {
    (producer: IFcProducer<T>);
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
    call<R>(where: W, eid?: string, timeout?: number): Promise<R>;
}
