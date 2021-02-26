import { IFcEventEmitter } from "./util";

export interface FcProduct<T = any> {
    data?: T;
    time: number;
    id: string;
}
export interface FcProducerRunHandler<T = any> {
    (producer: IFcProducer<T>);
}
export interface IFcProducer<T = any> extends IFcEventEmitter<FcProduct<T>> {
    create(data: T, time?: number, id?: string);
}
export interface FcStoragerRequestHandler<T = any> {
    (data: T | T[]);
}
export interface IFcStorager<T = any> extends IFcEventEmitter<FcProduct<T>> {
    push(data: FcProduct<T>);
    destory();
}

export interface IFcObserver<T = any> extends IFcEventEmitter<FcProduct<T>> {
    storager?: IFcStorager<T>;
    connect(storager?: IFcStorager<T>): Promise<void>;
    close();
    call<R>(where: T, eid?: string, timeout?: number): Promise<R>;
}
