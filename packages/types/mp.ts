import { MpViewType } from "@mpkit/types";
import {
    FcCommonProduct,
    FcProductType,
    FcRequestProduct,
    FcResponseProduct,
} from "./core";
import { FcEventHandler } from "./util";

export interface FcMpApiProduct<T = any, K = any>
    extends FcCommonProduct<string, string>,
        FcResponseProduct<T, K> {
    type: FcProductType.MpApi;
    result?: any;
    execEndTime?: number;
    children?: FcMpApiProduct<T, K>[];
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
    FcMpSocketTask?,
    FcMpApiProduct<T, K>?
];

export interface FcMpHookInfo {
    socketTasks?: Array<FcMpSocketTaskHookInfo>;
    productMap: { [prop: string]: FcMpApiProduct | FcMpViewProduct };
}
export interface FcMpViewContextBase<T = any> {
    $tid: string;
    $cid: string;
    data: T;
    $mkNativeSetData(data: any, callback?: Function): void;
    setData(data: any, callback?: Function): void;
    $fcEvents?: { [prop: string]: FcEventHandler[] };
    $fcUnDispatchEvents?: Array<[string, any, FcMpViewContextBase]>;
    $fcGetProp<T = any>(prop: string): T;
    /** 向父组件（不限层级）广播数据 */
    $fcDispatch(type: string, data: any, root: FcMpViewContextBase);
    $fcGetParentTid(): string;
    $fcGetParentCid(): string;
    $fcOn(this: FcMpViewContextBase, name: string, handler: FcEventHandler);
    $fcOnce(this: FcMpViewContextBase, name: string, handler: FcEventHandler);
    $fcEmit(this: FcMpViewContextBase, name: string, data?: any);
    $fcOff(this: FcMpViewContextBase, name: string, handler?: FcEventHandler);
    [prop: string]: any;
}

export interface FcMpViewMethod<T = any> {
    (this: T & FcMpViewContextBase);
}
