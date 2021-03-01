import { FcProduct } from "./provider";

export enum FcProductType {
    Console,
    Event,
    MpApi,
    MpView,
}

export interface FcCommonProduct<C = string, G = string> extends FcProduct {
    /** 大类 */
    type: FcProductType;
    /** 小类 */
    category?: C;
    /** 分组 */
    group?: G;
}

export enum FcMethodExecStatus {
    Executed,
    Success,
    Fail,
}

export interface FcResponseProduct<T = any, K = any>
    extends FcRequestProduct<T> {
    status: FcMethodExecStatus;
    endTime?: number;
    response?: K[];
}

export interface FcRequestProduct<T = any> {
    request: T[];
}

export interface FcConsoleProduct
    extends FcCommonProduct<string, string>,
        FcRequestProduct {
    type: FcProductType.Console;
}
