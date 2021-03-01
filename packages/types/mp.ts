import { MpViewType } from "@mpkit/types";
import {
    FcCommonProduct,
    FcProductType,
    FcRequestProduct,
    FcResponseProduct,
} from "./core";

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
    Unknown,
    Connecting,
    Opened,
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
