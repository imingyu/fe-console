import { MpView, EBus, MkMap } from "@mpkit/types";
export enum FecStorageType {
    Api = "Api",
    View = "View",
    Method = "Method",
    Console = "Console",
    Event = "Event",
}
export interface FecStorageDataLike {
    id?: string;
    type: FecStorageType;
    time?: number;
}
export interface FecStorageData extends FecStorageDataLike {
    id: string;
    time: number;
}
interface MethodData extends FecStorageData {
    name: string;
    args: any[];
    result?: any;
    status: FecMethodStatus;
    endTime?: number;
    error?: Error;
    errorType?: string;
}
export interface FecStorageMethodData extends MethodData {
    view: MpView;
}
export interface FecStorageViewData extends FecStorageData {
    view: MpView;
}
export enum FecMethodStatus {
    Executed = "Executed",
    Success = "Success",
    Fail = "Fail",
}
export enum MpHasTaskApi {
    request = "request",
    downloadFile = "downloadFile",
    uploadFile = "uploadFile",
    connectSocket = "connectSocket",
    createUDPSocket = "createUDPSocket",
}
export interface FecStorageApiData extends MethodData {
    response?: any;
    children?: FecStorageApiData[];
}
export interface MpEventTarget {
    dataset: any;
}
export interface MpEvent {
    type: string;
    target: MpEventTarget;
    currentTarget: MpEventTarget;
    detail: any;
}
export interface FecStorageEventData extends FecStorageData {
    name: string;
    args: any[];
    event: MpEvent;
    triggerView: MpView;
    handleView: MpView;
}
export interface FecStorageConsoleData extends FecStorageData {
    args: any[];
}
export interface FecStorageFinder<T> {
    (item: T, index: number, arr: T[]): boolean;
}

export interface FecStorageLike extends EBus {
    push(data: FecStorageDataLike);
    pushApiTask(apiData: FecStorageApiData);
    removeApiTask(apiName: MpHasTaskApi, dataId: string);
    getApiTaskMap(apiName: MpHasTaskApi): MkMap<FecStorageApiData>;
    get(id: string): FecStorageData;
    getAll(): FecStorageData[];
    getType(type: FecStorageType): FecStorageData[];
    findType(
        type: FecStorageType,
        finder: FecStorageFinder<FecStorageData>
    ): null | FecStorageData;
    filterType(
        type: FecStorageType,
        finder: FecStorageFinder<FecStorageData>
    ): FecStorageData[];
}
