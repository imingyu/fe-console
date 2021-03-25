import { MpViewType } from "@mpkit/types";
import {
    FcCommonProduct,
    FcConsoleProduct,
    FcProducerOptions,
    FcProductType,
    FcResponseProduct,
} from "./core";
import { IFcObserver } from "./provider";
import { Fc, FcStandardCallback } from "./standard";
import { FcEventHandler } from "./util";

export interface FcMpApiProduct<T = any, K = any>
    extends FcCommonProduct<string, string>,
        FcResponseProduct<T, K> {
    type: FcProductType.MpApi;
    result?: any;
    execEndTime?: number;
}

export interface FcMpViewProduct
    extends FcCommonProduct<string, string>,
        FcResponseProduct {
    type: FcProductType.MpView;
    category: MpViewType;
    execEndTime?: number;
    result?: any;
    eventTriggerPid?: string;
    eventHandlePid?: string;
    eventTriggerView?: any;
}

export interface FcMpSocketTask {
    close: Function;
    onClose: Function;
    onError: Function;
    onMessage: Function;
    onOpen: Function;
    send: Function;
}

export enum FcMpSocketTaskStatus {
    Unknown = 1,
    Connecting = 2,
    Opened = 3,
}

export type FcMpSocketTaskHookInfo<T = any, K = any> = [
    string,
    FcMpSocketTaskStatus,
    FcMpSocketTask?
];

export interface FcMpHookInfo {
    socketTasks?: Array<FcMpSocketTaskHookInfo>;
    productMap?: { [prop: string]: FcMpApiProduct | FcMpViewProduct };
}
export interface FcMpViewContextAny {
    [prop: string]: any;
}
export interface FcMpViewContextBase<T = any> {
    $fcExports?: any;
    $fcComponent?: boolean;
    $mkDiffSetDataBeforeValue?: Function;
    $fcObserverHandler?(
        type: string,
        data: FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
    );
    $fcRunConfig?: FcMpRunConfig;
    $fc?: Fc;
    $fcComponentIsDeatoryed?: boolean;
    $tid: string;
    $cid: string;
    data: T;
    $mkNativeSetData(data: any, callback?: Function): void;
    setData(data: any, callback?: Function): void;
    $fcEvents?: { [prop: string]: FcEventHandler[] };
    $fcUnDispatchEvents?: Array<[string, any, FcMpViewContextBase]>;
    $fcGetProp(prop: string, defaultVal?: any): any;
    /** 向父组件（不限层级）广播数据 */
    $fcDispatch(type: string, data?: any, root?: FcMpViewContextBase);
    $fcGetParentTid(): string;
    $fcGetParentCid(): string;
    $fcOn(this: FcMpViewContextBase, name: string, handler: FcEventHandler);
    $fcOnce(this: FcMpViewContextBase, name: string, handler: FcEventHandler);
    $fcEmit(this: FcMpViewContextBase, name: string, data?: any);
    $fcOff(this: FcMpViewContextBase, name: string, handler?: FcEventHandler);
    $fcObserver?: IFcObserver<
        string,
        FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
    >;
    onFcObserverEvent?(
        type: string,
        data: FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
    );
    $fcGetBaseExports(): any;
}

export interface FcMpViewMethod<T = any> {
    (this: T & FcMpViewContextBase);
}

export interface FcMpApiCategoryMap {
    [prop: string]: string | FcMpApiCategoryGetter;
}
export interface FcMpApiCategoryGetter {
    (product: Partial<FcMpApiProduct>): string;
}

export interface FcMpApiCategoryInfo {
    text: string;
    value: string;
}

export interface FcMpRunConfig {
    observer?: string[];
    producerOptions?: FcProducerOptions<
        FcMpApiProduct | FcMpViewProduct | FcConsoleProduct
    >;
    apiCategoryGetter: FcMpApiCategoryMap | FcMpApiCategoryGetter;
    apiCategoryList: Array<string | FcMpApiCategoryInfo>;
}

export interface FcMpEventTarget {
    dataset: {
        [prop: string]: any;
    };
}
export interface FcMpEvent<T = any> {
    type: string;
    target: FcMpEventTarget;
    currentTarget: FcMpEventTarget;
    detail?: T;
}

export interface FcMpScrollEventDetail {
    scrollTop: number;
    scrollHeight: number;
}
