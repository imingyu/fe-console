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

export interface FcStackInfo {
    original: string;
    lineNumebr?: number;
    column?: number;
    /** 文件路径 */
    fileName?: string;
    /** 执行目标，如：Object.keys, obj.show, print */
    target?: string;
    /** 执行方法名称，如：keys, obj, print */
    method?: string;
    /** 执行方法归属名称，如：Object, obj  */
    ascription?: string;
}

export interface FcNameValue<V = any, T = string> {
    name: T;
    value?: V;
}
