import { FcMpViewContextBase } from "./mp";

export interface FcDataGridCol {
    field: string;
    title: string;
    subTitle?: string;
    width?: number; // 只接受%单位
}

export interface FcMpComponentPropObserver<
    T extends FcMpViewContextBase = FcMpViewContextBase,
    S = any
> {
    (this: FcMpViewContextBase & T, newVal: S, oldVal: S);
}
export interface FcMpComponentPropSpec<
    T extends FcMpViewContextBase = FcMpViewContextBase,
    S = any
> {
    type: Function | null;
    value?: S;
    observer?: FcMpComponentPropObserver<T, S>;
}
export interface FcMpComponentMethod<
    T extends FcMpViewContextBase = FcMpViewContextBase
> {
    (this: T, ...args);
}

export interface FcMpComponentMethods<
    T extends FcMpViewContextBase = FcMpViewContextBase
> {
    [prop: string]: FcMpComponentMethod<T>;
}

export interface FcMpComponentDataAny {
    data?: {
        [prop: string]: any;
    };
}

export interface FcMpComponentSpec<
    T extends FcMpViewContextBase = FcMpViewContextBase
> {
    options?: {
        [prop: string]: any;
    };
    data?: {
        [prop: string]: any;
    };
    properties?: {
        [prop: string]: Function | FcMpComponentPropSpec<T>;
    };
    methods?: FcMpComponentMethods<T>;
    created?: FcMpComponentMethod<T>;
    ready?: FcMpComponentMethod<T>;
    attached?: FcMpComponentMethod<T>;
    detached?: FcMpComponentMethod<T>;
    $mixinEnd?: Function;
    deriveDataFromProps?: Function;
}

export interface FcBoundingClientRect {
    width: number;
    height: number;
}
