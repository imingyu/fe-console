export interface FcEventHandler<T = any> {
    (type: string, data?: T);
}
export interface IFcEventEmitter<T = any> {
    on(type: string, handler: FcEventHandler<T>);
    once(type: string, handler: FcEventHandler<T>);
    off(type: string, handler?: FcEventHandler<T>);
    emit(type: string, data?: T);
    destory();
}
